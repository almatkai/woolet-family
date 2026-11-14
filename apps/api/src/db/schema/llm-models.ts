import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const llmModels = pgTable('llm_models', {
  id: text('id').primaryKey().notNull(),
  provider: text('provider').notNull(),
  modelId: text('model_id').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  contextWindow: integer('context_window'),
  inputModalities: jsonb('input_modalities').notNull().default(['text']),
  outputModalities: jsonb('output_modalities').notNull().default(['text']),
  supportsTools: boolean('supports_tools').notNull().default(false),
  supportsVision: boolean('supports_vision').notNull().default(false),
  isPopular: boolean('is_popular').notNull().default(true),
  enabled: boolean('enabled').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  providerModelIdx: uniqueIndex('llm_models_provider_model_id_idx').on(table.provider, table.modelId),
}));

export type LlmModel = typeof llmModels.$inferSelect;
export type NewLlmModel = typeof llmModels.$inferInsert;
