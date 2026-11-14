INSERT INTO "llm_models" (
    "id",
    "provider",
    "model_id",
    "display_name",
    "description",
    "context_window",
    "input_modalities",
    "output_modalities",
    "supports_tools",
    "supports_vision",
    "is_popular",
    "enabled",
    "sort_order"
) VALUES
('deepseek:deepseek-v4-flash', 'deepseek', 'deepseek-v4-flash', 'DeepSeek V4 Flash', 'Fast DeepSeek V4 text chat model.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 10),
('deepseek:deepseek-v4-pro', 'deepseek', 'deepseek-v4-pro', 'DeepSeek V4 Pro', 'Higher quality DeepSeek V4 text chat model.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 20)
ON CONFLICT ("id") DO UPDATE SET
    "display_name" = EXCLUDED."display_name",
    "description" = EXCLUDED."description",
    "context_window" = EXCLUDED."context_window",
    "input_modalities" = EXCLUDED."input_modalities",
    "output_modalities" = EXCLUDED."output_modalities",
    "supports_tools" = EXCLUDED."supports_tools",
    "supports_vision" = EXCLUDED."supports_vision",
    "is_popular" = EXCLUDED."is_popular",
    "enabled" = EXCLUDED."enabled",
    "sort_order" = EXCLUDED."sort_order",
    "updated_at" = now();
