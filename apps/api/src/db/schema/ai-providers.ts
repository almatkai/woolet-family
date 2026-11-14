import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export type AiProviderProtocol = 'openai-compatible' | 'anthropic-compatible';

export const aiProviders = pgTable('ai_providers', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  protocol: text('protocol').$type<AiProviderProtocol>().notNull(),
  baseUrl: text('base_url').notNull(),
  encryptedApiKey: text('encrypted_api_key').notNull(),
  apiKeyNonce: text('api_key_nonce').notNull(),
  wrappedDataKey: text('wrapped_data_key').notNull(),
  wrappedDataKeyNonce: text('wrapped_data_key_nonce').notNull(),
  masterKeyId: text('master_key_id').notNull(),
  credentialVersion: integer('credential_version').notNull().default(1),
  apiKeyHint: text('api_key_hint').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AiProviderRecord = typeof aiProviders.$inferSelect;
export type NewAiProviderRecord = typeof aiProviders.$inferInsert;
