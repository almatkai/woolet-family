import { TRPCError } from '@trpc/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { aiProviders, llmModels, marketDigests, type AiProviderProtocol } from '../db/schema';
import { checkPromptGuard, getAiStatus } from '../lib/ai';
import { createAnthropicCompatibleClient } from '../lib/anthropic-compatible-client';
import { getAiDigestLength } from '../lib/checkLimit';
import { adminProcedure, protectedProcedure, router } from '../lib/trpc';
import { TIER_LIMITS } from './bank';
import { AiConfigService } from '../services/ai/ai-config-service';
import { AiModelCredentialService } from '../services/ai/ai-model-credential-service';
import {
  AiProviderService,
  BUILT_IN_MANAGED_PROVIDERS,
  isBuiltInManagedProvider,
} from '../services/ai/ai-provider-service';
import { anomalyService } from '../services/ai/anomaly-service';
import {
  executeCapability as executeCapabilityAction,
  getCapabilityManifest as getCapabilityManifestAction,
} from '../services/ai/capability-registry';
import {
  chatWithCapabilities,
  deleteChatSessionById,
  getChatSessionById,
  getChatUsageStats,
  listChatSessions,
} from '../services/ai/chat-service';
import { digestService } from '../services/ai/digest-service';

const executeCapabilityInputSchema = z.object({
  capabilityId: z.string().min(1),
  args: z.record(z.string(), z.unknown()).optional(),
  dryRun: z.boolean().optional(),
  confirmationToken: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const chatAttachmentSchema = z.object({
  name: z.string().min(1).max(120),
  mimeType: z.string().min(1).max(120),
  qrText: z.string().max(4000).optional(),
  dataUrl: z.string().refine(
    (value) => value.startsWith('data:image/') || value.startsWith('data:application/pdf'),
    'Attachment must be an image or PDF data URL'
  ),
});

const BUILT_IN_AI_PROVIDERS = new Set([
  'openrouter',
  'openai',
  'alemai',
  'deepseek',
  'gemini',
  'groq',
]);
const providerIdSchema = z.string().min(1).max(80);
const providerProtocolSchema = z.enum(['openai-compatible', 'anthropic-compatible']);
const builtInManagedProviderSchema = z.enum(['openrouter', 'openai', 'alemai', 'deepseek', 'groq']);

async function ensureProviderExists(providerId: string) {
  if (BUILT_IN_AI_PROVIDERS.has(providerId)) return;
  const provider = await AiProviderService.find(providerId);
  if (!provider) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider "${providerId}" not found.` });
  }
}

function providerInputError(error: unknown): never {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: error instanceof Error ? error.message : 'Invalid provider settings',
  });
}

export const aiRouter = router({
  getDailyDigest: protectedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userTier = ctx.user.subscriptionTier || 'free';
      const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS];
      const todayUtc = new Date().toISOString().split('T')[0];
      const todayLocal = new Date().toLocaleDateString('en-CA');
      const targetDate = input?.date || todayUtc;
      const isToday = targetDate === todayUtc || targetDate === todayLocal;

      if (!limits.hasAiMarketDigest) {
        return {
          locked: true,
          userTier,
          digest: null,
          digestDate: targetDate,
          canRegenerate: false,
          remainingRegenerations: 0,
          regenerationLimit: 0,
          message: 'Upgrade to Pro or Premium to unlock AI Market Insights',
        };
      }

      let digest: string | null | undefined;
      if (isToday) {
        const digestLength = getAiDigestLength(userTier) || 'short';
        digest = await digestService.getDailyDigest(ctx.userId!, digestLength, targetDate);
      } else {
        const entry = await db.query.marketDigests.findFirst({
          where: and(
            eq(marketDigests.userId, ctx.userId!),
            eq(marketDigests.kind, 'daily'),
            eq(marketDigests.digestDate, targetDate)
          ),
        });
        digest = entry?.content;
        if (digest) {
          await digestService.cacheDigestForDate(ctx.userId!, targetDate, digest);
        }
      }

      const followUps = await db.query.marketDigests.findMany({
        where: and(
          eq(marketDigests.userId, ctx.userId!),
          eq(marketDigests.digestDate, targetDate),
          eq(marketDigests.kind, 'custom')
        ),
        orderBy: [asc(marketDigests.createdAt)],
      });

      const canRegenerate = userTier === 'premium' && isToday;
      const remainingRegenerations = canRegenerate
        ? await digestService.getRemainingCustomDigestCount(ctx.userId!, targetDate)
        : 0;

      return {
        locked: false,
        userTier,
        digest,
        followUps,
        digestDate: targetDate,
        canRegenerate,
        remainingRegenerations,
        regenerationLimit: (limits as any).aiDigestRegeneratePerDay || 0,
      };
    }),

  getAvailableDigestDates: protectedProcedure.query(async ({ ctx }) => {
    const entries = await db.query.marketDigests.findMany({
      where: and(eq(marketDigests.userId, ctx.userId!), eq(marketDigests.kind, 'daily')),
      columns: { digestDate: true },
    });

    return entries.map((entry) => entry.digestDate);
  }),

  getDigestHistory: protectedProcedure.query(async ({ ctx }) => {
    const userTier = ctx.user.subscriptionTier || 'free';
    const limits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS];

    if (!limits.hasAiMarketDigest) {
      return [];
    }

    return db.query.marketDigests.findMany({
      where: and(eq(marketDigests.userId, ctx.userId!), eq(marketDigests.kind, 'daily')),
      orderBy: [desc(marketDigests.digestDate)],
      limit: 10,
      columns: {
        digestDate: true,
        content: true,
      },
    });
  }),

  regenerateDigest: protectedProcedure
    .input(
      z.object({
        specs: z.string().min(5).max(500),
        date: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userTier = ctx.user.subscriptionTier || 'free';
      if (userTier !== 'premium') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Digest regeneration is a Premium feature. Upgrade to Premium to use it.',
        });
      }

      const guard = await checkPromptGuard(input.specs);
      if (!guard.isSafe) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Looks like you are trying to prompt inject, huh? 🤨',
        });
      }

      const digestLength = getAiDigestLength(userTier) || 'complete';
      const digest = await digestService.regenerateDigest(ctx.userId!, digestLength, input.specs, input.date);
      const remainingRegenerations = await digestService.getRemainingCustomDigestCount(ctx.userId!, input.date);

      return {
        digest,
        digestDate: new Date().toISOString().split('T')[0],
        remainingRegenerations,
      };
    }),

  getSpendingAnomalies: protectedProcedure.query(async ({ ctx }) => {
    return anomalyService.detectSpendingAnomalies(ctx.userId!, ctx.user.testMode);
  }),

  getChatUsage: protectedProcedure.query(async ({ ctx }) => {
    return getChatUsageStats(ctx.userId!, ctx.user.subscriptionTier || 'free');
  }),

  listSessions: protectedProcedure.query(async ({ ctx }) => {
    return listChatSessions(ctx.userId!);
  }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return getChatSessionById(ctx.userId!, input.sessionId);
    }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deleteChatSessionById(ctx.userId!, input.sessionId);
    }),

  getCapabilityManifest: protectedProcedure.query(async () => {
    return getCapabilityManifestAction();
  }),

  executeCapability: protectedProcedure
    .input(executeCapabilityInputSchema)
    .mutation(async ({ ctx, input }) => {
      return executeCapabilityAction({
        userId: ctx.userId!,
        capabilityId: input.capabilityId,
        args: input.args,
        dryRun: input.dryRun,
        confirmationToken: input.confirmationToken || null,
        idempotencyKey: input.idempotencyKey || null,
      });
    }),

  chat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        sessionId: z.string().uuid().optional().nullable(),
        attachments: z.array(chatAttachmentSchema).max(5).optional(),
        settings: z.object({
          allowAutonomousTransactions: z.boolean().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return chatWithCapabilities({
        userId: ctx.userId!,
        userTier: ctx.user.subscriptionTier || 'free',
        message: input.message,
        sessionId: input.sessionId,
        attachments: input.attachments,
        settings: input.settings,
      });
    }),

  getAiConfig: adminProcedure.query(async () => {
    return AiConfigService.getConfig();
  }),

  getLlmModels: adminProcedure.query(async () => {
    return db.query.llmModels.findMany({
      where: eq(llmModels.enabled, true),
      orderBy: [asc(llmModels.provider), asc(llmModels.sortOrder), asc(llmModels.displayName)],
    });
  }),

  listLlmModels: adminProcedure.query(async () => {
    const [models, credentials] = await Promise.all([
      db.query.llmModels.findMany({
        orderBy: [asc(llmModels.provider), asc(llmModels.sortOrder), asc(llmModels.displayName)],
      }),
      AiModelCredentialService.list(),
    ]);
    const credentialByModelId = new Map(credentials.map((credential) => [credential.modelId, credential]));
    return models.map((model) => {
      const credential = credentialByModelId.get(model.id);
      return {
        ...model,
        modelCredential: credential
          ? {
              apiKeyHint: credential.apiKeyHint,
              masterKeyId: credential.masterKeyId,
              updatedAt: credential.updatedAt,
            }
          : null,
      };
    });
  }),

  listAiProviders: adminProcedure.query(async () => {
    const [providers, encryption] = await Promise.all([
      AiProviderService.list(),
      Promise.resolve(AiProviderService.getEncryptionStatus()),
    ]);
    return { providers, encryption };
  }),

  createAiProvider: adminProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(100),
      protocol: providerProtocolSchema,
      baseUrl: z.string().url().max(2048),
      apiKey: z.string().min(8).max(4096),
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      try {
        return await AiProviderService.create(input);
      } catch (error) {
        providerInputError(error);
      }
    }),

  setBuiltInAiProviderCredential: adminProcedure
    .input(z.object({
      id: builtInManagedProviderSchema,
      apiKey: z.string().min(8).max(4096),
    }))
    .mutation(async ({ input }) => {
      try {
        return await AiProviderService.setBuiltInCredential(input.id, input.apiKey);
      } catch (error) {
        providerInputError(error);
      }
    }),

  removeBuiltInAiProviderCredentialOverride: adminProcedure
    .input(z.object({ id: builtInManagedProviderSchema }))
    .mutation(async ({ input }) => {
      await AiProviderService.removeBuiltInCredentialOverride(input.id);
      return { id: input.id };
    }),

  updateAiProvider: adminProcedure
    .input(z.object({
      id: providerIdSchema,
      name: z.string().trim().min(1).max(100).optional(),
      protocol: providerProtocolSchema.optional(),
      baseUrl: z.string().url().max(2048).optional(),
      apiKey: z.string().max(4096).optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const provider = await AiProviderService.find(input.id);
      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Provider not found.' });
      }
      const { id: _id, ...updates } = input;
      try {
        return await AiProviderService.update(provider, updates);
      } catch (error) {
        providerInputError(error);
      }
    }),

  deleteAiProvider: adminProcedure
    .input(z.object({ id: providerIdSchema }))
    .mutation(async ({ input }) => {
      if (isBuiltInManagedProvider(input.id)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Remove the database credential override to return this provider to its environment key.',
        });
      }
      const provider = await AiProviderService.find(input.id);
      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Provider not found.' });
      }
      const attachedModel = await db.query.llmModels.findFirst({
        where: eq(llmModels.provider, input.id),
        columns: { id: true },
      });
      if (attachedModel) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Delete this provider’s models from the catalog first.',
        });
      }
      await db.delete(aiProviders).where(eq(aiProviders.id, input.id));
      return { id: input.id };
    }),

  createLlmModel: adminProcedure
    .input(
      z.object({
        provider: providerIdSchema,
        modelId: z.string().min(1).max(255),
        displayName: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        contextWindow: z.number().int().positive().optional(),
        inputModalities: z.array(z.string()).min(1).default(['text']),
        outputModalities: z.array(z.string()).min(1).default(['text']),
        supportsTools: z.boolean().default(false),
        supportsVision: z.boolean().default(false),
        isPopular: z.boolean().default(true),
        enabled: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      await ensureProviderExists(input.provider);
      const id = `${input.provider}:${input.modelId}`;
      const existing = await db.query.llmModels.findFirst({ where: eq(llmModels.id, id) });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A model with id "${id}" already exists.`,
        });
      }

      const [created] = await db
        .insert(llmModels)
        .values({
          id,
          provider: input.provider,
          modelId: input.modelId,
          displayName: input.displayName,
          description: input.description ?? null,
          contextWindow: input.contextWindow ?? null,
          inputModalities: input.inputModalities,
          outputModalities: input.outputModalities,
          supportsTools: input.supportsTools,
          supportsVision: input.supportsVision,
          isPopular: input.isPopular,
          enabled: input.enabled,
          sortOrder: input.sortOrder,
        })
        .returning();

      return created;
    }),

  updateLlmModel: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        displayName: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        contextWindow: z.number().int().positive().nullish(),
        inputModalities: z.array(z.string()).min(1).optional(),
        outputModalities: z.array(z.string()).min(1).optional(),
        supportsTools: z.boolean().optional(),
        supportsVision: z.boolean().optional(),
        isPopular: z.boolean().optional(),
        enabled: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...patch } = input;
      const existing = await db.query.llmModels.findFirst({ where: eq(llmModels.id, id) });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Model "${id}" not found.` });
      }

      const values: Record<string, unknown> = { updatedAt: new Date() };
      if (patch.displayName !== undefined) values.displayName = patch.displayName;
      if (patch.description !== undefined) values.description = patch.description ?? null;
      if (patch.contextWindow !== undefined) values.contextWindow = patch.contextWindow ?? null;
      if (patch.inputModalities !== undefined) values.inputModalities = patch.inputModalities;
      if (patch.outputModalities !== undefined) values.outputModalities = patch.outputModalities;
      if (patch.supportsTools !== undefined) values.supportsTools = patch.supportsTools;
      if (patch.supportsVision !== undefined) values.supportsVision = patch.supportsVision;
      if (patch.isPopular !== undefined) values.isPopular = patch.isPopular;
      if (patch.enabled !== undefined) values.enabled = patch.enabled;
      if (patch.sortOrder !== undefined) values.sortOrder = patch.sortOrder;

      const [updated] = await db
        .update(llmModels)
        .set(values)
        .where(eq(llmModels.id, id))
        .returning();

      return updated;
    }),

  setLlmModelCredential: adminProcedure
    .input(z.object({
      id: z.string().min(1),
      apiKey: z.string().min(8).max(4096),
    }))
    .mutation(async ({ input }) => {
      const model = await db.query.llmModels.findFirst({ where: eq(llmModels.id, input.id) });
      if (!model) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Model "${input.id}" not found.` });
      }
      try {
        const credential = await AiModelCredentialService.set(model.id, input.apiKey);
        return {
          modelId: credential.modelId,
          apiKeyHint: credential.apiKeyHint,
          masterKeyId: credential.masterKeyId,
          updatedAt: credential.updatedAt,
        };
      } catch (error) {
        providerInputError(error);
      }
    }),

  removeLlmModelCredentialOverride: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const model = await db.query.llmModels.findFirst({ where: eq(llmModels.id, input.id) });
      if (!model) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Model "${input.id}" not found.` });
      }
      await AiModelCredentialService.remove(model.id);
      return { id: model.id };
    }),

  deleteLlmModel: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const existing = await db.query.llmModels.findFirst({ where: eq(llmModels.id, input.id) });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Model "${input.id}" not found.` });
      }

      await db.delete(llmModels).where(eq(llmModels.id, input.id));

      return { id: input.id };
    }),

  testLlmModel: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        message: z.string().min(1).max(2000).default('Hello, can you confirm you are working? Reply with one short sentence.'),
      })
    )
    .mutation(async ({ input }) => {
      const model = await db.query.llmModels.findFirst({ where: eq(llmModels.id, input.id) });
      if (!model) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Model "${input.id}" not found.` });
      }

      const provider = model.provider;
      const modelCredential = await AiModelCredentialService.find(model.id);

      if (provider === 'gemini') {
        const apiKey = modelCredential
          ? AiModelCredentialService.decrypt(modelCredential)
          : process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `No API key configured for model "${model.id}" or provider "gemini".`,
          });
        }
        const startedAt = Date.now();
        try {
          const client = new GoogleGenerativeAI(apiKey);
          const result = await client.getGenerativeModel({ model: model.modelId }).generateContent(input.message);
          return {
            ok: true,
            id: model.id,
            provider: model.provider,
            modelId: model.modelId,
            response: result.response.text().trim(),
            latencyMs: Date.now() - startedAt,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            ok: false,
            id: model.id,
            provider: model.provider,
            modelId: model.modelId,
            response: null,
            latencyMs: Date.now() - startedAt,
            error: message,
          };
        }
      }

      let baseUrl: string | undefined;
      let apiKey: string | undefined;
      let protocol: AiProviderProtocol | undefined;

      if (isBuiltInManagedProvider(provider)) {
        const definition = BUILT_IN_MANAGED_PROVIDERS[provider];
        protocol = definition.protocol;
        const databaseOverride = await AiProviderService.find(provider);
        if (databaseOverride) {
          if (!databaseOverride.enabled) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider "${provider}" is disabled.` });
          }
          baseUrl = databaseOverride.baseUrl;
          apiKey = modelCredential
            ? AiModelCredentialService.decrypt(modelCredential)
            : AiProviderService.decryptCredential(databaseOverride);
        } else {
          baseUrl = definition.baseUrl;
          apiKey = modelCredential
            ? AiModelCredentialService.decrypt(modelCredential)
            : definition.environmentApiKey();
        }
      } else {
        const customProvider = await AiProviderService.find(provider);
        if (!customProvider) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider "${provider}" not found.` });
        }
        if (!customProvider.enabled) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider "${provider}" is disabled.` });
        }
        if (!customProvider.encryptedApiKey) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Provider "${provider}" has no API key configured.` });
        }
        baseUrl = customProvider.baseUrl;
        protocol = customProvider.protocol;
        apiKey = modelCredential
          ? AiModelCredentialService.decrypt(modelCredential)
          : AiProviderService.decryptCredential(customProvider);
      }

      if (!apiKey) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `No API key configured for provider "${provider}". Add credentials in the Providers tab.`,
        });
      }

      const normalizedBaseUrl = baseUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '');
      const client = protocol === 'anthropic-compatible'
        ? createAnthropicCompatibleClient(normalizedBaseUrl, apiKey)
        : new OpenAI({ baseURL: normalizedBaseUrl, apiKey });

      const startedAt = Date.now();
      try {
        const completion = await client.chat.completions.create({
          model: model.modelId,
          messages: [{ role: 'user', content: input.message }],
          max_tokens: 200,
          temperature: 0,
        }) as OpenAI.Chat.Completions.ChatCompletion;

        const text = completion.choices[0]?.message?.content?.trim() || '';
        const latencyMs = Date.now() - startedAt;

        return {
          ok: true,
          id: model.id,
          provider: model.provider,
          modelId: model.modelId,
          response: text,
          latencyMs,
        };
      } catch (error) {
        const anyErr = error as any;
        const status = anyErr?.status ?? anyErr?.response?.status;
        const errorMessage = typeof status === 'number' ? `${status}: ${anyErr?.message || String(error)}` : (anyErr?.message || String(error));
        return {
          ok: false,
          id: model.id,
          provider: model.provider,
          modelId: model.modelId,
          response: null,
          latencyMs: Date.now() - startedAt,
          error: errorMessage,
        };
      }
    }),

  updateAiConfig: adminProcedure
    .input(
      z.object({
        providerOrder: z.array(providerIdSchema).optional(),
        defaultProvider: providerIdSchema.optional(),
        modelPriority: z.array(z.object({
          id: z.string().min(1),
          provider: providerIdSchema,
          model: z.string().min(1),
          enabled: z.boolean(),
        })).optional(),
        modelSettings: z
          .object({
            openrouter: z.object({ model: z.string(), enabled: z.boolean() }).optional(),
            openai: z.object({ model: z.string(), enabled: z.boolean() }).optional(),
            alemai: z.object({ model: z.string(), enabled: z.boolean() }).optional(),
            deepseek: z.object({ model: z.string(), enabled: z.boolean() }).optional(),
            gemini: z.object({ model: z.string(), enabled: z.boolean() }).optional(),
            groq: z.object({ model: z.string(), enabled: z.boolean() }).optional(),
          })
          .optional(),
        fallbackEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return AiConfigService.updateConfig(input);
    }),

  resetAiConfig: adminProcedure.mutation(async () => {
    return AiConfigService.resetToDefault();
  }),

  getAiStatus: adminProcedure.query(async () => {
    return getAiStatus();
  }),
});
