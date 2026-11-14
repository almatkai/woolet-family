CREATE TABLE IF NOT EXISTS "llm_models" (
    "id" text PRIMARY KEY NOT NULL,
    "provider" text NOT NULL,
    "model_id" text NOT NULL,
    "display_name" text NOT NULL,
    "description" text,
    "context_window" integer,
    "input_modalities" jsonb DEFAULT '["text"]'::jsonb NOT NULL,
    "output_modalities" jsonb DEFAULT '["text"]'::jsonb NOT NULL,
    "supports_tools" boolean DEFAULT false NOT NULL,
    "supports_vision" boolean DEFAULT false NOT NULL,
    "is_popular" boolean DEFAULT true NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "llm_models_provider_model_id_idx"
    ON "llm_models" ("provider", "model_id");
--> statement-breakpoint
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
-- Alem AI
('alemai:qwen3-6', 'alemai', 'qwen3-6', 'Qwen3 6B', 'Alem AI hosted Qwen3 vision chat model.', 32768, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 10),
('alemai:gemma4', 'alemai', 'gemma4', 'Gemma 4', 'Alem AI hosted Gemma vision chat model.', 32768, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 20),

-- DeepSeek
('deepseek:deepseek-v4-flash', 'deepseek', 'deepseek-v4-flash', 'DeepSeek V4 Flash', 'Fast DeepSeek V4 text chat model.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 10),
('deepseek:deepseek-v4-pro', 'deepseek', 'deepseek-v4-pro', 'DeepSeek V4 Pro', 'Higher quality DeepSeek V4 text chat model.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 20),

-- OpenRouter
('openrouter:openrouter/auto', 'openrouter', 'openrouter/auto', 'Auto Router', 'OpenRouter automatic model routing.', NULL, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 10),
('openrouter:anthropic/claude-sonnet-4.5', 'openrouter', 'anthropic/claude-sonnet-4.5', 'Claude Sonnet 4.5', 'Strong coding and agentic workflow model via OpenRouter.', 1000000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 20),
('openrouter:anthropic/claude-haiku-4.5', 'openrouter', 'anthropic/claude-haiku-4.5', 'Claude Haiku 4.5', 'Fast Anthropic model via OpenRouter.', 200000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 30),
('openrouter:google/gemini-2.5-pro', 'openrouter', 'google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Advanced Google reasoning model via OpenRouter.', 1000000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 40),
('openrouter:google/gemini-2.5-flash', 'openrouter', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Fast price-performance Google model via OpenRouter.', 1000000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 50),
('openrouter:deepseek/deepseek-chat-v3.1', 'openrouter', 'deepseek/deepseek-chat-v3.1', 'DeepSeek V3.1', 'Popular open model for coding, tool use, and general chat.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 60),
('openrouter:qwen/qwen3-32b', 'openrouter', 'qwen/qwen3-32b', 'Qwen3 32B', 'Efficient Qwen model for multilingual chat and reasoning.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 70),
('openrouter:qwen/qwen3-coder', 'openrouter', 'qwen/qwen3-coder', 'Qwen3 Coder', 'Qwen coding model for agentic software workflows.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 80),

-- OpenAI
('openai:gpt-5.5', 'openai', 'gpt-5.5', 'GPT-5.5', 'Frontier OpenAI model for coding and professional work.', 1050000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 10),
('openai:gpt-5.5-pro', 'openai', 'gpt-5.5-pro', 'GPT-5.5 Pro', 'Higher intelligence OpenAI model for precise responses.', 1050000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 20),
('openai:gpt-5.4', 'openai', 'gpt-5.4', 'GPT-5.4', 'Affordable OpenAI model for coding and professional work.', 1050000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 30),
('openai:gpt-4.1', 'openai', 'gpt-4.1', 'GPT-4.1', 'Long-context OpenAI chat model.', 1000000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 40),
('openai:gpt-4.1-mini', 'openai', 'gpt-4.1-mini', 'GPT-4.1 Mini', 'Smaller GPT-4.1 model for lower-latency tasks.', 1000000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 50),
('openai:gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4o Mini', 'Legacy cost-efficient OpenAI chat model.', 128000, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 60),

-- Gemini
('gemini:gemini-2.5-flash', 'gemini', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'Google price-performance model for low-latency, high-volume tasks.', 1000000, '["text","image","audio","video"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 10),
('gemini:gemini-2.5-flash-lite', 'gemini', 'gemini-2.5-flash-lite', 'Gemini 2.5 Flash-Lite', 'Fast and budget-friendly Gemini 2.5 model.', 1000000, '["text","image","audio","video"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 20),
('gemini:gemini-2.5-pro', 'gemini', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 'Google model for advanced reasoning and coding.', 1000000, '["text","image","audio","video"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 30),
('gemini:gemini-1.5-flash', 'gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 'Legacy Gemini default used by existing deployments.', 1000000, '["text","image","audio","video"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 40),

-- Groq
('groq:llama-3.1-8b-instant', 'groq', 'llama-3.1-8b-instant', 'Llama 3.1 8B Instant', 'Very fast Groq production model.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 10),
('groq:llama-3.3-70b-versatile', 'groq', 'llama-3.3-70b-versatile', 'Llama 3.3 70B Versatile', 'Higher quality Groq production Llama model.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 20),
('groq:openai/gpt-oss-120b', 'groq', 'openai/gpt-oss-120b', 'GPT OSS 120B', 'OpenAI open-weight model hosted by Groq.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 30),
('groq:openai/gpt-oss-20b', 'groq', 'openai/gpt-oss-20b', 'GPT OSS 20B', 'Smaller OpenAI open-weight model hosted by Groq.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 40),
('groq:groq/compound', 'groq', 'groq/compound', 'Groq Compound', 'Groq system with agentic tooling.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 50),
('groq:groq/compound-mini', 'groq', 'groq/compound-mini', 'Groq Compound Mini', 'Smaller Groq system with agentic tooling.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 60),
('groq:qwen/qwen3-32b', 'groq', 'qwen/qwen3-32b', 'Qwen3 32B', 'Qwen preview model hosted by Groq.', 131072, '["text"]'::jsonb, '["text"]'::jsonb, true, false, true, true, 70),
('groq:meta-llama/llama-4-scout-17b-16e-instruct', 'groq', 'meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout', 'Meta Llama preview model hosted by Groq.', 131072, '["text","image"]'::jsonb, '["text"]'::jsonb, true, true, true, true, 80)
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
