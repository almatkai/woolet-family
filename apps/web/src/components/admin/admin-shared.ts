import { trpc } from '@/lib/trpc';

export const BUILT_IN_AI_PROVIDERS: string[] = ['openrouter', 'openai', 'alemai', 'deepseek', 'gemini', 'groq'];

export type AiProvider = string;
export type AiProviderProtocol = 'openai-compatible' | 'anthropic-compatible';

export interface ModelSettings {
  openrouter?: { model: string; enabled: boolean };
  openai?: { model: string; enabled: boolean };
  alemai?: { model: string; enabled: boolean };
  deepseek?: { model: string; enabled: boolean };
  groq?: { model: string; enabled: boolean };
  gemini?: { model: string; enabled: boolean };
}

export interface AiConfig {
  id: string;
  providerOrder: AiProvider[];
  defaultProvider: AiProvider;
  modelSettings: ModelSettings;
  modelPriority: ModelPriorityItem[];
  fallbackEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelPriorityItem {
  id: string;
  provider: AiProvider;
  model: string;
  enabled: boolean;
}

export interface LlmModel {
  id: string;
  provider: AiProvider;
  modelId: string;
  displayName: string;
  description?: string | null;
  contextWindow?: number | null;
  inputModalities: string[];
  outputModalities: string[];
  supportsTools: boolean;
  supportsVision: boolean;
  isPopular: boolean;
  enabled: boolean;
  sortOrder: number;
  modelCredential?: {
    apiKeyHint: string;
    masterKeyId: string;
    updatedAt: Date;
  } | null;
}

export interface ModelFormState {
  provider: AiProvider;
  modelId: string;
  displayName: string;
  description: string;
  contextWindow: string;
  supportsTools: boolean;
  supportsVision: boolean;
  isPopular: boolean;
  enabled: boolean;
  sortOrder: string;
}

export interface ManagedAiProvider {
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

export interface ProviderFormState {
  name: string;
  protocol: AiProviderProtocol;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export function useIsAdmin() {
  return trpc.user.isAdmin.useQuery();
}
