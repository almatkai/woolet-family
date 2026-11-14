CREATE TABLE IF NOT EXISTS "ai_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"protocol" text NOT NULL,
	"base_url" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"api_key_nonce" text NOT NULL,
	"wrapped_data_key" text NOT NULL,
	"wrapped_data_key_nonce" text NOT NULL,
	"master_key_id" text NOT NULL,
	"credential_version" integer DEFAULT 1 NOT NULL,
	"api_key_hint" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_providers_protocol_check" CHECK ("protocol" IN ('openai-compatible', 'anthropic-compatible'))
);
