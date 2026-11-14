import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { llmModels } from './llm-models';

export const aiModelCredentials = pgTable('ai_model_credentials', {
  modelId: text('model_id')
    .primaryKey()
    .notNull()
    .references(() => llmModels.id, { onDelete: 'cascade' }),
  encryptedApiKey: text('encrypted_api_key').notNull(),
  apiKeyNonce: text('api_key_nonce').notNull(),
  wrappedDataKey: text('wrapped_data_key').notNull(),
  wrappedDataKeyNonce: text('wrapped_data_key_nonce').notNull(),
  masterKeyId: text('master_key_id').notNull(),
  credentialVersion: integer('credential_version').notNull().default(1),
  apiKeyHint: text('api_key_hint').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AiModelCredentialRecord = typeof aiModelCredentials.$inferSelect;
export type NewAiModelCredentialRecord = typeof aiModelCredentials.$inferInsert;
