ALTER TABLE "chat_messages"
    ADD COLUMN IF NOT EXISTS "trace" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "chat_messages"
    ADD COLUMN IF NOT EXISTS "client_action" jsonb;
