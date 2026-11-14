import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { AiConfigService } from '../services/ai/ai-config-service';
import {
    AiProviderService,
    BUILT_IN_MANAGED_PROVIDERS,
    isBuiltInManagedProvider,
} from '../services/ai/ai-provider-service';
import { AiModelCredentialService } from '../services/ai/ai-model-credential-service';
import { db } from '../db';
import {
    type AiModelCredentialRecord,
    type AiProviderRecord,
    type ModelPriorityItem,
} from '../db/schema';
import { logger } from './logger';
import { createAnthropicCompatibleClient } from './anthropic-compatible-client';

type BuiltInAiProvider = 'openrouter' | 'openai' | 'alemai' | 'deepseek' | 'gemini' | 'groq';
type AiProvider = string;
const aiLogger = logger.child({ module: 'ai-lib' });

const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALEM_AI_QWEN3_6_API_KEY = process.env.ALEM_AI_QWEN3_6;
const ALEM_AI_GEMMA4_API_KEY = process.env.ALEM_AI_GEMMA4;
const ALEM_AI_ENDPOINT = process.env.ALEM_AI_ENDPOINT || 'https://llm.alem.ai/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_ENDPOINT = process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL;
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME;

// Default values (used if DB config is not available)
const DEFAULT_OPENROUTER_CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'openrouter/auto';
const DEFAULT_OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
const DEFAULT_ALEM_AI_CHAT_MODEL = process.env.ALEM_AI_CHAT_MODEL || 'qwen3-6';
const DEFAULT_DEEPSEEK_CHAT_MODEL = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash';
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const DEFAULT_GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
const NO_CHAT_CANDIDATES_MESSAGE = 'No enabled AI chat models are available for this request. Check Admin Panel model priority and provider API keys.';
const NO_VISION_CHAT_CANDIDATES_MESSAGE = 'This request includes an image or PDF, but no enabled AI chat model supports vision. Enable a vision-capable model in Admin Panel model priority, such as AlemAI Qwen3/Gemma4, OpenAI, Gemini, or a vision model through OpenRouter.';

const DEFAULT_PROVIDER_ORDER: BuiltInAiProvider[] = (process.env.AI_PROVIDER_ORDER || 'alemai,deepseek,openrouter,groq,openai,gemini')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((s): s is BuiltInAiProvider => s === 'openrouter' || s === 'openai' || s === 'alemai' || s === 'deepseek' || s === 'gemini' || s === 'groq');

function isBuiltInProvider(provider: string): provider is BuiltInAiProvider {
    return provider === 'openrouter' || provider === 'openai' || provider === 'alemai' || provider === 'deepseek' || provider === 'gemini' || provider === 'groq';
}

function isEnabled(provider: BuiltInAiProvider): boolean {
    if (provider === 'openrouter') return Boolean(OPENROUTER_API_KEY);
    if (provider === 'openai') return Boolean(OPENAI_API_KEY);
    if (provider === 'alemai') return Boolean(ALEM_AI_QWEN3_6_API_KEY || ALEM_AI_GEMMA4_API_KEY);
    if (provider === 'deepseek') return Boolean(DEEPSEEK_API_KEY);
    if (provider === 'gemini') return Boolean(GEMINI_API_KEY);
    if (provider === 'groq') return Boolean(GROQ_API_KEY);
    return false;
}

function selectEnabledProviders(
    providerOverrides: Map<string, AiProviderRecord>,
    modelCredentialIds: Set<string>,
    order: AiProvider[] = DEFAULT_PROVIDER_ORDER,
    config?: {
        modelSettings?: {
            openrouter?: { enabled?: boolean };
            openai?: { enabled?: boolean };
            alemai?: { enabled?: boolean };
            deepseek?: { enabled?: boolean };
            gemini?: { enabled?: boolean };
            groq?: { enabled?: boolean };
        };
    },
    models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; gemini?: string; groq?: string }
): BuiltInAiProvider[] {
    const seen = new Set<BuiltInAiProvider>();
    const providers = (order.length ? order : DEFAULT_PROVIDER_ORDER).filter(isBuiltInProvider);
    return providers.filter((p) => {
        if (seen.has(p)) return false;
        seen.add(p);
        
        // Check if provider is disabled in config
        const isProviderDisabled = config?.modelSettings?.[p]?.enabled === false;
        if (isProviderDisabled) {
            return false;
        }
        
        // A database row is an explicit override. Its disabled state must not
        // silently fall back to an environment credential.
        const databaseOverride = p === 'gemini' ? undefined : providerOverrides.get(p);
        if (databaseOverride) return databaseOverride.enabled;

        const model = modelForProvider(p, config, models);
        return modelCredentialIds.has(`${p}:${model}`) || isEnabled(p);
    });
}

async function loadProviderOverrides() {
    const providerRows = await db.query.aiProviders.findMany();
    return new Map(providerRows.map((provider) => [provider.id, provider]));
}

async function loadModelCredentials() {
    const credentialRows = await AiModelCredentialService.list();
    return new Map(credentialRows.map((credential) => [credential.modelId, credential]));
}

async function enabledProviders(
    order: AiProvider[] = DEFAULT_PROVIDER_ORDER,
    config?: Parameters<typeof selectEnabledProviders>[3],
    models?: Parameters<typeof selectEnabledProviders>[4]
) {
    const [providerOverrides, modelCredentials] = await Promise.all([
        loadProviderOverrides(),
        loadModelCredentials(),
    ]);
    return selectEnabledProviders(providerOverrides, new Set(modelCredentials.keys()), order, config, models);
}

type BuiltInChatProvider = 'openrouter' | 'openai' | 'alemai' | 'deepseek' | 'groq';
type ChatModelCandidate = {
    id: string;
    provider: string;
    model: string;
    displayName?: string;
    supportsVision?: boolean;
    databaseProvider?: AiProviderRecord;
    modelCredential?: AiModelCredentialRecord;
};

function isBuiltInChatProvider(provider: string): provider is BuiltInChatProvider {
    return provider === 'openrouter' || provider === 'openai' || provider === 'alemai' || provider === 'deepseek' || provider === 'groq';
}

function legacyModelForProvider(provider: BuiltInChatProvider, aiConfig: any, opts?: {
    models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; groq?: string };
}) {
    return provider === 'openrouter'
        ? (opts?.models?.openrouter || aiConfig.modelSettings?.openrouter?.model || DEFAULT_OPENROUTER_CHAT_MODEL)
        : provider === 'openai'
        ? (opts?.models?.openai || aiConfig.modelSettings?.openai?.model || DEFAULT_OPENAI_CHAT_MODEL)
        : provider === 'alemai'
        ? (opts?.models?.alemai || aiConfig.modelSettings?.alemai?.model || DEFAULT_ALEM_AI_CHAT_MODEL)
        : provider === 'deepseek'
        ? (opts?.models?.deepseek || aiConfig.modelSettings?.deepseek?.model || DEFAULT_DEEPSEEK_CHAT_MODEL)
        : (opts?.models?.groq || aiConfig.modelSettings?.groq?.model || DEFAULT_GROQ_CHAT_MODEL);
}

function modelForProvider(
    provider: BuiltInAiProvider,
    aiConfig: any,
    models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; gemini?: string; groq?: string }
) {
    if (provider === 'gemini') {
        return models?.gemini || aiConfig?.modelSettings?.gemini?.model || DEFAULT_GEMINI_MODEL;
    }
    return legacyModelForProvider(provider, aiConfig, { models });
}

async function getChatClient(candidate: ChatModelCandidate) {
    if (candidate.modelCredential || candidate.databaseProvider) {
        const apiKey = candidate.modelCredential
            ? AiModelCredentialService.decrypt(candidate.modelCredential)
            : AiProviderService.decryptCredential(candidate.databaseProvider!);
        const builtInDefinition = isBuiltInManagedProvider(candidate.provider)
            ? BUILT_IN_MANAGED_PROVIDERS[candidate.provider]
            : undefined;
        const protocol = candidate.databaseProvider?.protocol || builtInDefinition?.protocol;
        const baseUrl = candidate.databaseProvider?.baseUrl || builtInDefinition?.baseUrl;
        if (!protocol || !baseUrl) {
            throw new Error(`Provider "${candidate.provider}" is not configured for model "${candidate.id}"`);
        }
        if (protocol === 'anthropic-compatible') {
            return createAnthropicCompatibleClient(baseUrl, apiKey);
        }
        return new OpenAI({
            baseURL: normalizeOpenAiBaseUrl(baseUrl),
            apiKey,
            defaultHeaders: candidate.provider === 'openrouter'
                ? {
                    ...(OPENROUTER_SITE_URL ? { 'HTTP-Referer': OPENROUTER_SITE_URL } : {}),
                    ...(OPENROUTER_APP_NAME ? { 'X-Title': OPENROUTER_APP_NAME } : {}),
                  }
                : undefined,
        });
    }

    const provider = candidate.provider as BuiltInChatProvider;
    return provider === 'openrouter'
        ? openrouter
        : provider === 'openai'
        ? openai
        : provider === 'alemai'
        ? createAlemAiClient(candidate.model)
        : provider === 'deepseek'
        ? new OpenAI({
            baseURL: normalizeOpenAiBaseUrl(DEEPSEEK_ENDPOINT),
            apiKey: DEEPSEEK_API_KEY || 'missing-deepseek-key',
          })
        : (groq as any);
}

async function buildChatModelCandidates(aiConfig: any, opts?: {
    providerOrder?: AiProvider[];
    models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; groq?: string };
    requireVision?: boolean;
}): Promise<ChatModelCandidate[]> {
    const configuredPriority = Array.isArray(aiConfig.modelPriority)
        ? (aiConfig.modelPriority as ModelPriorityItem[])
        : [];

    if (configuredPriority.length > 0 && !opts?.providerOrder && !opts?.models) {
        const [modelRows, providerRows, modelCredentialRows] = await Promise.all([
            db.query.llmModels.findMany(),
            db.query.aiProviders.findMany(),
            AiModelCredentialService.list(),
        ]);
        const modelById = new Map(modelRows.map((model) => [model.id, model]));
        const providerById = new Map(providerRows.map((provider) => [provider.id, provider]));
        const modelCredentialById = new Map(modelCredentialRows.map((credential) => [credential.modelId, credential]));
        const seen = new Set<string>();

        return configuredPriority
            .filter((item) => item.enabled !== false)
            .flatMap((item): ChatModelCandidate[] => {
                const metadata = modelById.get(item.id);
                if (!metadata || metadata.enabled === false) return [];
                const databaseOverride = providerById.get(item.provider);
                const modelCredential = modelCredentialById.get(item.id);
                if (databaseOverride) {
                    if (!databaseOverride.enabled) return [];
                    return [{
                        id: item.id,
                        provider: item.provider,
                        model: item.model,
                        displayName: metadata.displayName,
                        supportsVision: metadata.supportsVision,
                        databaseProvider: databaseOverride,
                        modelCredential,
                    }];
                }
                if (!isBuiltInChatProvider(item.provider) || (!modelCredential && !isEnabled(item.provider))) return [];
                return [{
                    id: item.id,
                    provider: item.provider,
                    model: item.model,
                    displayName: metadata.displayName,
                    supportsVision: metadata.supportsVision,
                    modelCredential,
                }];
            })
            .filter((candidate) => !opts?.requireVision || candidate.supportsVision === true)
            .filter((candidate) => {
                if (seen.has(candidate.id)) return false;
                seen.add(candidate.id);
                return true;
            });
    }

    const [providerOverrides, modelCredentials] = await Promise.all([
        loadProviderOverrides(),
        loadModelCredentials(),
    ]);
    const providers = selectEnabledProviders(
        providerOverrides,
        new Set(modelCredentials.keys()),
        opts?.providerOrder || aiConfig.providerOrder,
        aiConfig,
        opts?.models
    )
        .filter(isBuiltInChatProvider)
        .filter((p) => !opts?.requireVision || p === 'openrouter' || p === 'openai');

    return providers.map((provider) => ({
        id: `${provider}:${legacyModelForProvider(provider, aiConfig, opts)}`,
        provider,
        model: legacyModelForProvider(provider, aiConfig, opts),
        databaseProvider: providerOverrides.get(provider),
        modelCredential: modelCredentials.get(`${provider}:${legacyModelForProvider(provider, aiConfig, opts)}`),
    }));
}

function shouldFallback(error: unknown): boolean {
    const anyErr = error as any;
    const status = anyErr?.status ?? anyErr?.response?.status;

    // Network/transport
    if (anyErr?.name === 'AbortError') return true;
    if (anyErr instanceof TypeError) return true;

    // OpenAI SDK errors often expose `status`
    if (typeof status === 'number') {
        if (status === 408) return true;
        if (status === 429) return true;
        if (status >= 500) return true;
        // 401/403 can be fixed by switching providers (different keys)
        if (status === 401 || status === 403) return true;
    }

    return true;
}

function summarizeError(error: unknown): string {
    const anyErr = error as any;
    const status = anyErr?.status ?? anyErr?.response?.status;
    const message = anyErr?.message || String(error);
    return typeof status === 'number' ? `${status}: ${message}` : message;
}

function normalizeOpenAiBaseUrl(endpoint: string): string {
    return endpoint.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '');
}

function getAlemAiApiKey(model: string): string {
    if (model.toLowerCase().includes('gemma')) {
        return ALEM_AI_GEMMA4_API_KEY || ALEM_AI_QWEN3_6_API_KEY || 'missing-alem-ai-key';
    }
    return ALEM_AI_QWEN3_6_API_KEY || ALEM_AI_GEMMA4_API_KEY || 'missing-alem-ai-key';
}

export const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY || 'missing-openrouter-key',
    defaultHeaders: {
        ...(OPENROUTER_SITE_URL ? { 'HTTP-Referer': OPENROUTER_SITE_URL } : {}),
        ...(OPENROUTER_APP_NAME ? { 'X-Title': OPENROUTER_APP_NAME } : {}),
    },
});

export const openai = new OpenAI({
    apiKey: OPENAI_API_KEY || 'missing-openai-key',
});

export function createAlemAiClient(model: string) {
    return new OpenAI({
        baseURL: normalizeOpenAiBaseUrl(ALEM_AI_ENDPOINT),
        apiKey: getAlemAiApiKey(model),
    });
}

export const groq = new Groq({
    apiKey: GROQ_API_KEY || 'missing-groq-key',
});

export const gemini = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Backwards compatible defaults (previously used as OpenRouter model IDs)
export const MODEL_FLASH = DEFAULT_OPENROUTER_CHAT_MODEL;
export const MODEL_PRO = DEFAULT_OPENROUTER_CHAT_MODEL;

export async function createChatCompletionWithFallback(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
    opts?: {
        providerOrder?: AiProvider[];
        models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; groq?: string };
        purpose?: string;
        config?: any;
        requireVision?: boolean;
    }
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const startedAt = Date.now();
    // Load config if not provided
    const aiConfig = opts?.config || await AiConfigService.getConfig();
    
    const candidates = await buildChatModelCandidates(aiConfig, opts);

    aiLogger.info({
        event: 'chat.completion.start',
        purpose: opts?.purpose || 'none',
        providers: candidates.map((candidate) => candidate.provider),
        models: candidates.map((candidate) => candidate.id),
        messageCount: params.messages?.length ?? 0,
        toolCount: Array.isArray(params.tools) ? params.tools.length : 0,
    });

    if (candidates.length === 0) {
        throw new Error(opts?.requireVision ? NO_VISION_CHAT_CANDIDATES_MESSAGE : NO_CHAT_CANDIDATES_MESSAGE);
    }

    const errors: Array<{ provider: string; error: unknown }> = [];

    for (const candidate of candidates) {
        const { provider, model } = candidate;
        const providerStartedAt = Date.now();
        try {
            const client = await getChatClient(candidate);

            aiLogger.info({
                event: 'chat.completion.provider_attempt',
                provider,
                model,
                purpose: opts?.purpose || 'none',
            });

            const completion = await client.chat.completions.create({
                ...params,
                model,
            });
            (completion as any).__wooletProvider = provider;
            (completion as any).__wooletModel = model;
            aiLogger.info({
                event: 'chat.completion.provider_success',
                provider,
                model,
                purpose: opts?.purpose || 'none',
                durationMs: Date.now() - providerStartedAt,
                totalDurationMs: Date.now() - startedAt,
                finishReason: completion.choices?.[0]?.finish_reason ?? null,
                hasToolCalls: Boolean(completion.choices?.[0]?.message?.tool_calls?.length),
            });
            return completion;
        } catch (error) {
            aiLogger.error({
                event: 'chat.completion.provider_failed',
                provider,
                model,
                purpose: opts?.purpose || 'none',
                durationMs: Date.now() - providerStartedAt,
                error: summarizeError(error),
            });
            errors.push({ provider, error });
            if (!shouldFallback(error) || aiConfig.fallbackEnabled === false) break;
        }
    }

    const message =
        `All chat providers failed` +
        (opts?.purpose ? ` (${opts.purpose})` : '') +
        `: ` +
        errors.map((e) => `${e.provider} => ${summarizeError(e.error)}`).join(' | ');
    throw new Error(message);
}

export async function createChatCompletionStreamWithFallback(
    params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, 'stream'>,
    opts?: {
        providerOrder?: AiProvider[];
        models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; groq?: string };
        purpose?: string;
        config?: any;
        requireVision?: boolean;
        onProviderFailure?: (event: {
            provider: string;
            model: string;
            error: string;
            willRetry: boolean;
            nextProvider?: string;
        }) => void | Promise<void>;
    }
): Promise<{
    provider: string;
    model: string;
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
}> {
    const startedAt = Date.now();
    const aiConfig = opts?.config || await AiConfigService.getConfig();
    const candidates = await buildChatModelCandidates(aiConfig, opts);

    aiLogger.info({
        event: 'chat.completion.stream.start',
        purpose: opts?.purpose || 'none',
        providers: candidates.map((candidate) => candidate.provider),
        models: candidates.map((candidate) => candidate.id),
        messageCount: params.messages?.length ?? 0,
        toolCount: Array.isArray(params.tools) ? params.tools.length : 0,
    });

    if (candidates.length === 0) {
        throw new Error(opts?.requireVision ? NO_VISION_CHAT_CANDIDATES_MESSAGE : NO_CHAT_CANDIDATES_MESSAGE);
    }

    const errors: Array<{ provider: string; error: unknown }> = [];

    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        const candidate = candidates[candidateIndex];
        const { provider, model } = candidate;
        const providerStartedAt = Date.now();

        try {
            const client = await getChatClient(candidate);

            aiLogger.info({
                event: 'chat.completion.stream.provider_attempt',
                provider,
                model,
                purpose: opts?.purpose || 'none',
            });

            const stream = await client.chat.completions.create({
                ...params,
                model,
                stream: true,
            });

            aiLogger.info({
                event: 'chat.completion.stream.provider_started',
                provider,
                model,
                purpose: opts?.purpose || 'none',
                durationMs: Date.now() - providerStartedAt,
                totalDurationMs: Date.now() - startedAt,
            });

            return { provider, model, stream };
        } catch (error) {
            const summarizedError = summarizeError(error);
            const canFallback = shouldFallback(error) && aiConfig.fallbackEnabled !== false;
            const nextCandidate = canFallback ? candidates[candidateIndex + 1] : undefined;
            aiLogger.error({
                event: 'chat.completion.stream.provider_failed',
                provider,
                model,
                purpose: opts?.purpose || 'none',
                durationMs: Date.now() - providerStartedAt,
                error: summarizedError,
            });
            errors.push({ provider, error });
            await opts?.onProviderFailure?.({
                provider,
                model,
                error: summarizedError,
                willRetry: Boolean(nextCandidate),
                nextProvider: nextCandidate?.provider,
            });
            if (!canFallback) break;
        }
    }

    const message =
        `All chat stream providers failed` +
        (opts?.purpose ? ` (${opts.purpose})` : '') +
        `: ` +
        errors.map((e) => `${e.provider} => ${summarizeError(e.error)}`).join(' | ');
    throw new Error(message);
}

export async function generateTextWithFallback(
    input: {
        prompt: string;
        system?: string;
        purpose?: string;
        temperature?: number;
    },
    opts?: {
        providerOrder?: AiProvider[];
        models?: { openrouter?: string; openai?: string; alemai?: string; deepseek?: string; gemini?: string; groq?: string };
        config?: {
            modelSettings?: {
                openrouter?: { model: string; enabled?: boolean };
                openai?: { model: string; enabled?: boolean };
                alemai?: { model: string; enabled?: boolean };
                deepseek?: { model: string; enabled?: boolean };
                gemini?: { model: string; enabled?: boolean };
                groq?: { model: string; enabled?: boolean };
            };
            providerOrder?: AiProvider[];
            fallbackEnabled?: boolean;
        };
    }
): Promise<{ text: string; provider: AiProvider; model: string }>
{
    const startedAt = Date.now();
    // Load config if not provided
    const aiConfig = opts?.config || await AiConfigService.getConfig();

    const hasCustomProviderInPriority = !opts?.providerOrder
        && !opts?.models
        && Array.isArray((aiConfig as any).modelPriority)
        && (aiConfig as any).modelPriority.some((item: ModelPriorityItem) => item.provider.startsWith('custom_'));

    if (hasCustomProviderInPriority) {
        const completion = await createChatCompletionWithFallback(
            {
                model: 'will-be-overridden',
                messages: [
                    ...(input.system ? [{ role: 'system', content: input.system } as const] : []),
                    { role: 'user', content: input.prompt } as const,
                ],
                temperature: input.temperature,
            },
            {
                purpose: input.purpose,
                config: aiConfig,
            }
        );
        return {
            text: completion.choices[0]?.message?.content || '',
            provider: String((completion as any).__wooletProvider || 'unknown'),
            model: String((completion as any).__wooletModel || completion.model),
        };
    }
    
    const providers = await enabledProviders(opts?.providerOrder || aiConfig.providerOrder, aiConfig, opts?.models);

    aiLogger.info({
        event: 'text.generation.start',
        purpose: input?.purpose || 'none',
        providers,
        promptLength: input.prompt.length,
        hasSystemPrompt: Boolean(input.system),
    });
    
    const errors: Array<{ provider: AiProvider; error: unknown }> = [];

    for (const provider of providers) {
        try {
            const providerStartedAt = Date.now();
            if (provider === 'gemini') {
                const model = opts?.models?.gemini || aiConfig.modelSettings?.gemini?.model || DEFAULT_GEMINI_MODEL;
                const modelCredential = await AiModelCredentialService.find(`gemini:${model}`);
                const geminiClient = modelCredential
                    ? new GoogleGenerativeAI(AiModelCredentialService.decrypt(modelCredential))
                    : gemini;
                if (!geminiClient) throw new Error('Gemini client not configured');
                aiLogger.info({
                    event: 'text.generation.provider_attempt',
                    provider,
                    model,
                    purpose: input?.purpose || 'none',
                });
                
                const modelClient = geminiClient.getGenerativeModel({ model });
                const prompt = input.system
                    ? `System:\n${input.system}\n\nUser:\n${input.prompt}`
                    : input.prompt;

                const result = await modelClient.generateContent(prompt);
                const text = result.response.text();
                aiLogger.info({
                    event: 'text.generation.provider_success',
                    provider,
                    model,
                    purpose: input?.purpose || 'none',
                    durationMs: Date.now() - providerStartedAt,
                    totalDurationMs: Date.now() - startedAt,
                    outputLength: text.length,
                });
                return { text, provider, model };
            }

            // OpenAI-compatible providers (OpenAI, OpenRouter, Groq)
            const completion = await createChatCompletionWithFallback(
                {
                    model: 'will-be-overridden',
                    messages: [
                        ...(input.system ? [{ role: 'system', content: input.system } as const] : []),
                        { role: 'user', content: input.prompt } as const,
                    ],
                    temperature: input.temperature,
                },
                {
                    providerOrder: [provider as any],
                    models: {
                        openrouter: opts?.models?.openrouter,
                        openai: opts?.models?.openai,
                        alemai: opts?.models?.alemai,
                        deepseek: opts?.models?.deepseek,
                        groq: opts?.models?.groq,
                    },
                    purpose: input.purpose,
                    config: aiConfig,
                }
            );
            const text = completion.choices[0]?.message?.content || '';
            const modelUsed = (completion as any)?.model || 
                (provider === 'openrouter' ? aiConfig.modelSettings?.openrouter?.model || DEFAULT_OPENROUTER_CHAT_MODEL : 
                 provider === 'openai' ? aiConfig.modelSettings?.openai?.model || DEFAULT_OPENAI_CHAT_MODEL : 
                 provider === 'alemai' ? aiConfig.modelSettings?.alemai?.model || DEFAULT_ALEM_AI_CHAT_MODEL :
                 provider === 'deepseek' ? aiConfig.modelSettings?.deepseek?.model || DEFAULT_DEEPSEEK_CHAT_MODEL :
                 aiConfig.modelSettings?.groq?.model || DEFAULT_GROQ_CHAT_MODEL);
            aiLogger.info({
                event: 'text.generation.provider_success',
                provider,
                model: modelUsed,
                purpose: input?.purpose || 'none',
                durationMs: Date.now() - providerStartedAt,
                totalDurationMs: Date.now() - startedAt,
                outputLength: text.length,
            });
            return { text, provider, model: modelUsed };
        } catch (error) {
            aiLogger.error({
                event: 'text.generation.provider_failed',
                provider,
                purpose: input?.purpose || 'none',
                error: summarizeError(error),
            });
            errors.push({ provider, error });
            if (!shouldFallback(error) || aiConfig.fallbackEnabled === false) break;
        }
    }

    const message =
        `All text providers failed` +
        (input.purpose ? ` (${input.purpose})` : '') +
        `: ` +
        errors.map((e) => `${e.provider} => ${summarizeError(e.error)}`).join(' | ');
    throw new Error(message);
}

export async function getAiStatus() {
    try {
        const [config, providerOverrides, modelCredentials] = await Promise.all([
            AiConfigService.getConfig(),
            loadProviderOverrides(),
            loadModelCredentials(),
        ]);
        const providerEnabled = (provider: BuiltInAiProvider) => {
            const databaseOverride = provider === 'gemini' ? undefined : providerOverrides.get(provider);
            if (databaseOverride) return databaseOverride.enabled;
            const model = modelForProvider(provider, config);
            return modelCredentials.has(`${provider}:${model}`) || isEnabled(provider);
        };
        return {
            enabled: {
                openrouter: providerEnabled('openrouter') && config.modelSettings?.openrouter?.enabled !== false,
                openai: providerEnabled('openai') && config.modelSettings?.openai?.enabled !== false,
                alemai: providerEnabled('alemai') && config.modelSettings?.alemai?.enabled !== false,
                deepseek: providerEnabled('deepseek') && config.modelSettings?.deepseek?.enabled !== false,
                gemini: providerEnabled('gemini') && config.modelSettings?.gemini?.enabled !== false,
                groq: providerEnabled('groq') && config.modelSettings?.groq?.enabled !== false,
            },
            models: {
                openrouter: config.modelSettings?.openrouter?.model || DEFAULT_OPENROUTER_CHAT_MODEL,
                openai: config.modelSettings?.openai?.model || DEFAULT_OPENAI_CHAT_MODEL,
                alemai: config.modelSettings?.alemai?.model || DEFAULT_ALEM_AI_CHAT_MODEL,
                deepseek: config.modelSettings?.deepseek?.model || DEFAULT_DEEPSEEK_CHAT_MODEL,
                gemini: config.modelSettings?.gemini?.model || DEFAULT_GEMINI_MODEL,
                groq: config.modelSettings?.groq?.model || DEFAULT_GROQ_CHAT_MODEL,
            },
            providerOrder: config.providerOrder || DEFAULT_PROVIDER_ORDER,
            modelPriority: config.modelPriority || [],
            defaultProvider: config.defaultProvider,
            fallbackEnabled: config.fallbackEnabled,
        };
    } catch (error) {
        aiLogger.error({
            event: 'ai.status.failed_to_fetch_config',
            error: summarizeError(error),
        });
        return {
            enabled: {
                openrouter: Boolean(OPENROUTER_API_KEY),
                openai: Boolean(OPENAI_API_KEY),
                alemai: Boolean(ALEM_AI_QWEN3_6_API_KEY || ALEM_AI_GEMMA4_API_KEY),
                deepseek: Boolean(DEEPSEEK_API_KEY),
                gemini: Boolean(GEMINI_API_KEY),
                groq: Boolean(GROQ_API_KEY),
            },
            models: {
                openrouter: DEFAULT_OPENROUTER_CHAT_MODEL,
                openai: DEFAULT_OPENAI_CHAT_MODEL,
                alemai: DEFAULT_ALEM_AI_CHAT_MODEL,
                deepseek: DEFAULT_DEEPSEEK_CHAT_MODEL,
                gemini: DEFAULT_GEMINI_MODEL,
                groq: DEFAULT_GROQ_CHAT_MODEL,
            },
            providerOrder: DEFAULT_PROVIDER_ORDER,
            modelPriority: [],
            defaultProvider: 'openrouter',
            fallbackEnabled: true,
        };
    }
}

export async function checkPromptGuard(content: string): Promise<{ isSafe: boolean; score: number }> {
    try {
        const promptGuardModelId = 'groq:meta-llama/llama-prompt-guard-2-86m';
        const [databaseOverride, modelCredential] = await Promise.all([
            AiProviderService.find('groq'),
            AiModelCredentialService.find(promptGuardModelId),
        ]);
        if (databaseOverride && !databaseOverride.enabled) {
            return { isSafe: true, score: 0 };
        }
        if (!modelCredential && !databaseOverride && !GROQ_API_KEY) {
            return { isSafe: true, score: 0 };
        }
        const promptGuardApiKey = modelCredential
            ? AiModelCredentialService.decrypt(modelCredential)
            : databaseOverride
              ? AiProviderService.decryptCredential(databaseOverride)
              : null;
        const promptGuardClient = promptGuardApiKey ? new Groq({ apiKey: promptGuardApiKey }) : groq;
        aiLogger.info({
            event: 'prompt_guard.start',
            provider: 'groq',
            model: 'meta-llama/llama-prompt-guard-2-86m',
            contentLength: content.length,
        });
        const completion = await promptGuardClient.chat.completions.create({
            model: "meta-llama/llama-prompt-guard-2-86m",
            messages: [
                {
                    role: "user",
                    content: content
                }
            ],
            temperature: 1,
            max_completion_tokens: 1,
            top_p: 1,
            stream: false,
            stop: null
        } as any);

        const textResult = completion.choices[0].message.content || "0";
        const score = parseFloat(textResult);

        const result = {
            isSafe: score <= 0.93,
            score
        };
        aiLogger.info({
            event: 'prompt_guard.result',
            score,
            isSafe: result.isSafe,
        });
        return result;
    } catch (error) {
        aiLogger.error({
            event: 'prompt_guard.failed',
            error: summarizeError(error),
        });
        return { isSafe: true, score: 0 };
    }
}
