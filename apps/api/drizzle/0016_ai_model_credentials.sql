CREATE TABLE IF NOT EXISTS "ai_model_credentials" (
	"model_id" text PRIMARY KEY NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"api_key_nonce" text NOT NULL,
	"wrapped_data_key" text NOT NULL,
	"wrapped_data_key_nonce" text NOT NULL,
	"master_key_id" text NOT NULL,
	"credential_version" integer DEFAULT 1 NOT NULL,
	"api_key_hint" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_model_credentials_model_id_llm_models_id_fk"
		FOREIGN KEY ("model_id") REFERENCES "public"."llm_models"("id")
		ON DELETE CASCADE
);
