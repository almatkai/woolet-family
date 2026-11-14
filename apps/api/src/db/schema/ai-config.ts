import { pgTable, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';

export interface ModelSettings {
  openrouter?: { model: string; enabled: boolean };
  openai?: { model: string; enabled: boolean };
  alemai?: { model: string; enabled: boolean };
  deepseek?: { model: string; enabled: boolean };
  groq?: { model: string; enabled: boolean };
  gemini?: { model: string; enabled: boolean };
}

export interface ModelPriorityItem {
  id: string;
  provider: AiProvider;
  model: string;
  enabled: boolean;
}

export const aiConfig = pgTable('ai_config', {
  id: text('id').primaryKey().notNull().default('default'),
  providerOrder: jsonb('provider_order').notNull(),
  defaultProvider: text('default_provider'),
  modelSettings: jsonb('model_settings').notNull(),
  modelPriority: jsonb('model_priority').$type<ModelPriorityItem[]>().notNull().default([]),
  fallbackEnabled: boolean('fallback_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Default configuration
export const defaultAiConfig = {
  id: 'default',
  providerOrder: ['alemai', 'deepseek', 'openrouter', 'groq', 'openai', 'gemini'],
  defaultProvider: 'alemai',
  modelSettings: {
    alemai: { model: 'qwen3-6', enabled: true },
    deepseek: { model: 'deepseek-v4-flash', enabled: true },
    openrouter: { model: 'openrouter/auto', enabled: true },
    openai: { model: 'gpt-4o-mini', enabled: true },
    groq: { model: 'llama-3.1-8b-instant', enabled: true },
    gemini: { model: 'gemini-1.5-flash', enabled: true },
  },
  modelPriority: [
    { id: 'alemai:qwen3-6', provider: 'alemai', model: 'qwen3-6', enabled: true },
    { id: 'alemai:gemma4', provider: 'alemai', model: 'gemma4', enabled: true },
    { id: 'deepseek:deepseek-v4-flash', provider: 'deepseek', model: 'deepseek-v4-flash', enabled: true },
    { id: 'deepseek:deepseek-v4-pro', provider: 'deepseek', model: 'deepseek-v4-pro', enabled: true },
    { id: 'openai:gpt-4o-mini', provider: 'openai', model: 'gpt-4o-mini', enabled: true },
    { id: 'openrouter:openrouter/auto', provider: 'openrouter', model: 'openrouter/auto', enabled: true },
    { id: 'groq:llama-3.1-8b-instant', provider: 'groq', model: 'llama-3.1-8b-instant', enabled: true },
    { id: 'gemini:gemini-1.5-flash', provider: 'gemini', model: 'gemini-1.5-flash', enabled: true },
  ] satisfies ModelPriorityItem[],
  fallbackEnabled: true,
};

export type AiConfig = typeof aiConfig.$inferSelect & {
  providerOrder: AiProvider[];
  modelSettings: ModelSettings;
  modelPriority: ModelPriorityItem[];
};
export type AiConfigInsert = typeof aiConfig.$inferInsert & {
  providerOrder?: AiProvider[];
  modelSettings?: ModelSettings;
};

export type AiProvider = string;
