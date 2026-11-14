import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { db } from '../../db';
import {
  aiProviders,
  type AiProviderProtocol,
  type AiProviderRecord,
} from '../../db/schema';
import {
  decryptApiKey,
  encryptApiKey,
  getSecretEncryptionStatus,
} from '../../lib/secret-envelope';

const API_KEY_MIN_LENGTH = 8;

export const BUILT_IN_MANAGED_PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    protocol: 'openai-compatible' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    environmentApiKey: () => process.env.OPEN_ROUTER_API_KEY,
  },
  openai: {
    name: 'OpenAI',
    protocol: 'openai-compatible' as const,
    baseUrl: 'https://api.openai.com/v1',
    environmentApiKey: () => process.env.OPENAI_API_KEY,
  },
  alemai: {
    name: 'AlemAI',
    protocol: 'openai-compatible' as const,
    baseUrl: process.env.ALEM_AI_ENDPOINT || 'https://llm.alem.ai/v1/chat/completions',
    environmentApiKey: () => process.env.ALEM_AI_QWEN3_6 || process.env.ALEM_AI_GEMMA4,
  },
  deepseek: {
    name: 'DeepSeek',
    protocol: 'openai-compatible' as const,
    baseUrl: process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions',
    environmentApiKey: () => process.env.DEEPSEEK_API_KEY,
  },
  groq: {
    name: 'Groq',
    protocol: 'openai-compatible' as const,
    baseUrl: 'https://api.groq.com/openai/v1',
    environmentApiKey: () => process.env.GROQ_API_KEY,
  },
} satisfies Record<string, {
  name: string;
  protocol: AiProviderProtocol;
  baseUrl: string;
  environmentApiKey: () => string | undefined;
}>;

export type BuiltInManagedProviderId = keyof typeof BUILT_IN_MANAGED_PROVIDERS;

export function isBuiltInManagedProvider(providerId: string): providerId is BuiltInManagedProviderId {
  return providerId in BUILT_IN_MANAGED_PROVIDERS;
}

export interface AiProviderSummary {
  id: string;
  name: string;
  protocol: AiProviderProtocol;
  baseUrl: string;
  enabled: boolean;
  apiKeyHint: string | null;
  masterKeyId: string | null;
  builtIn: boolean;
  credentialSource: 'database' | 'environment' | 'missing';
  hasDatabaseOverride: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function normalizeBaseUrl(rawUrl: string) {
  const url = new URL(rawUrl.trim());
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('provider endpoint must use HTTP or HTTPS');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('provider endpoint must not contain credentials, query parameters, or a fragment');
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('provider endpoint must use HTTPS in production');
  }
  return url.toString().replace(/\/$/, '');
}

function validateApiKey(apiKey: string) {
  const normalized = apiKey.trim();
  if (normalized.length < API_KEY_MIN_LENGTH || normalized.length > 4096) {
    throw new Error(`API key must be between ${API_KEY_MIN_LENGTH} and 4096 characters`);
  }
  return normalized;
}

function toSummary(provider: AiProviderRecord): AiProviderSummary {
  return {
    id: provider.id,
    name: provider.name,
    protocol: provider.protocol,
    baseUrl: provider.baseUrl,
    enabled: provider.enabled,
    apiKeyHint: provider.apiKeyHint,
    masterKeyId: provider.masterKeyId,
    builtIn: isBuiltInManagedProvider(provider.id),
    credentialSource: 'database',
    hasDatabaseOverride: true,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export class AiProviderService {
  static getEncryptionStatus() {
    return getSecretEncryptionStatus();
  }

  static async list(): Promise<AiProviderSummary[]> {
    const providerRows = await db.query.aiProviders.findMany({
      orderBy: (provider, { asc }) => [asc(provider.name)],
    });
    const providerById = new Map(providerRows.map((provider) => [provider.id, provider]));
    const builtInProviders = Object.entries(BUILT_IN_MANAGED_PROVIDERS).map(([id, definition]) => {
      const databaseOverride = providerById.get(id);
      if (databaseOverride) return toSummary(databaseOverride);

      const environmentApiKey = definition.environmentApiKey()?.trim();
      return {
        id,
        name: definition.name,
        protocol: definition.protocol,
        baseUrl: definition.baseUrl,
        enabled: Boolean(environmentApiKey),
        apiKeyHint: environmentApiKey ? environmentApiKey.slice(-4) : null,
        masterKeyId: null,
        builtIn: true,
        credentialSource: environmentApiKey ? 'environment' as const : 'missing' as const,
        hasDatabaseOverride: false,
        createdAt: null,
        updatedAt: null,
      };
    });
    const customProviders = providerRows
      .filter((provider) => !isBuiltInManagedProvider(provider.id))
      .map(toSummary);
    return [...builtInProviders, ...customProviders];
  }

  static async find(providerId: string) {
    return db.query.aiProviders.findFirst({
      where: eq(aiProviders.id, providerId),
    });
  }

  static async create(input: {
    name: string;
    protocol: AiProviderProtocol;
    baseUrl: string;
    apiKey: string;
    enabled: boolean;
  }): Promise<AiProviderSummary> {
    const id = `custom_${randomUUID()}`;
    const apiKey = validateApiKey(input.apiKey);
    const encrypted = encryptApiKey(id, apiKey);
    const [provider] = await db
      .insert(aiProviders)
      .values({
        id,
        name: input.name.trim(),
        protocol: input.protocol,
        baseUrl: normalizeBaseUrl(input.baseUrl),
        ...encrypted,
        apiKeyHint: apiKey.slice(-4),
        enabled: input.enabled,
      })
      .returning();
    return toSummary(provider);
  }

  static async setBuiltInCredential(providerId: BuiltInManagedProviderId, rawApiKey: string) {
    const definition = BUILT_IN_MANAGED_PROVIDERS[providerId];
    const apiKey = validateApiKey(rawApiKey);
    const encrypted = encryptApiKey(providerId, apiKey);
    const now = new Date();
    const [provider] = await db
      .insert(aiProviders)
      .values({
        id: providerId,
        name: definition.name,
        protocol: definition.protocol,
        baseUrl: normalizeBaseUrl(definition.baseUrl),
        ...encrypted,
        apiKeyHint: apiKey.slice(-4),
        enabled: true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: aiProviders.id,
        set: {
          name: definition.name,
          protocol: definition.protocol,
          baseUrl: normalizeBaseUrl(definition.baseUrl),
          ...encrypted,
          apiKeyHint: apiKey.slice(-4),
          enabled: true,
          updatedAt: now,
        },
      })
      .returning();
    return toSummary(provider);
  }

  static async removeBuiltInCredentialOverride(providerId: BuiltInManagedProviderId) {
    await db.delete(aiProviders).where(eq(aiProviders.id, providerId));
  }

  static async update(
    provider: AiProviderRecord,
    input: {
      name?: string;
      protocol?: AiProviderProtocol;
      baseUrl?: string;
      apiKey?: string;
      enabled?: boolean;
    }
  ): Promise<AiProviderSummary> {
    const values: Partial<typeof aiProviders.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.name !== undefined) values.name = input.name.trim();
    if (input.protocol !== undefined) values.protocol = input.protocol;
    if (input.baseUrl !== undefined) values.baseUrl = normalizeBaseUrl(input.baseUrl);
    if (input.enabled !== undefined) values.enabled = input.enabled;
    if (input.apiKey !== undefined && input.apiKey.trim()) {
      const apiKey = validateApiKey(input.apiKey);
      Object.assign(values, encryptApiKey(provider.id, apiKey), {
        apiKeyHint: apiKey.slice(-4),
      });
    }

    const [updated] = await db
      .update(aiProviders)
      .set(values)
      .where(eq(aiProviders.id, provider.id))
      .returning();
    return toSummary(updated);
  }

  static decryptCredential(provider: AiProviderRecord) {
    return decryptApiKey(provider.id, {
      encryptedApiKey: provider.encryptedApiKey,
      apiKeyNonce: provider.apiKeyNonce,
      wrappedDataKey: provider.wrappedDataKey,
      wrappedDataKeyNonce: provider.wrappedDataKeyNonce,
      masterKeyId: provider.masterKeyId,
      credentialVersion: provider.credentialVersion,
    });
  }
}
