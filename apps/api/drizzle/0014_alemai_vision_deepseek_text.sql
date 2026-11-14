UPDATE "llm_models"
SET
    "description" = CASE
        WHEN "id" = 'deepseek:deepseek-v4-flash' THEN 'Fast DeepSeek V4 text chat model.'
        WHEN "id" = 'deepseek:deepseek-v4-pro' THEN 'Higher quality DeepSeek V4 text chat model.'
        ELSE "description"
    END,
    "input_modalities" = '["text"]'::jsonb,
    "supports_vision" = false,
    "updated_at" = now()
WHERE "id" IN ('deepseek:deepseek-v4-flash', 'deepseek:deepseek-v4-pro');
--> statement-breakpoint
UPDATE "llm_models"
SET
    "description" = CASE
        WHEN "id" = 'alemai:qwen3-6' THEN 'Alem AI hosted Qwen3 vision chat model.'
        WHEN "id" = 'alemai:gemma4' THEN 'Alem AI hosted Gemma vision chat model.'
        ELSE "description"
    END,
    "input_modalities" = '["text","image"]'::jsonb,
    "supports_vision" = true,
    "updated_at" = now()
WHERE "id" IN ('alemai:qwen3-6', 'alemai:gemma4');
