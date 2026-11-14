ALTER TABLE "ai_config"
    ADD COLUMN IF NOT EXISTS "model_priority" jsonb DEFAULT '[]'::jsonb NOT NULL;
