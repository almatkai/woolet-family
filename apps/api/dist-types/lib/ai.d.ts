import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { type ModelPriorityItem } from '../db/schema';
type AiProvider = 'openrouter' | 'openai' | 'alemai' | 'deepseek' | 'gemini' | 'groq';
export declare const openrouter: OpenAI;
export declare const openai: OpenAI;
export declare function createAlemAiClient(model: string): OpenAI;
export declare const groq: Groq;
export declare const gemini: GoogleGenerativeAI | null;
export declare const MODEL_FLASH: string;
export declare const MODEL_PRO: string;
export declare function createChatCompletionWithFallback(params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, opts?: {
    providerOrder?: AiProvider[];
    models?: {
        openrouter?: string;
        openai?: string;
        alemai?: string;
        deepseek?: string;
        groq?: string;
    };
    purpose?: string;
    config?: any;
    requireVision?: boolean;
}): Promise<OpenAI.Chat.Completions.ChatCompletion>;
export declare function createChatCompletionStreamWithFallback(params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, 'stream'>, opts?: {
    providerOrder?: AiProvider[];
    models?: {
        openrouter?: string;
        openai?: string;
        alemai?: string;
        deepseek?: string;
        groq?: string;
    };
    purpose?: string;
    config?: any;
    requireVision?: boolean;
    onProviderFailure?: (event: {
        provider: string;
        model: string;
        error: string;
        willRetry: boolean;
        nextProvider?: string;
    }) => void | Promise<void>;
}): Promise<{
    provider: string;
    model: string;
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
}>;
export declare function generateTextWithFallback(input: {
    prompt: string;
    system?: string;
    purpose?: string;
    temperature?: number;
}, opts?: {
    providerOrder?: AiProvider[];
    models?: {
        openrouter?: string;
        openai?: string;
        alemai?: string;
        deepseek?: string;
        gemini?: string;
        groq?: string;
    };
    config?: {
        modelSettings?: {
            openrouter?: {
                model: string;
                enabled?: boolean;
            };
            openai?: {
                model: string;
                enabled?: boolean;
            };
            alemai?: {
                model: string;
                enabled?: boolean;
            };
            deepseek?: {
                model: string;
                enabled?: boolean;
            };
            gemini?: {
                model: string;
                enabled?: boolean;
            };
            groq?: {
                model: string;
                enabled?: boolean;
            };
        };
        providerOrder?: AiProvider[];
        fallbackEnabled?: boolean;
    };
}): Promise<{
    text: string;
    provider: AiProvider;
    model: string;
}>;
export declare function getAiStatus(): Promise<{
    enabled: {
        openrouter: boolean;
        openai: boolean;
        alemai: boolean;
        deepseek: boolean;
        gemini: boolean;
        groq: boolean;
    };
    models: {
        openrouter: string;
        openai: string;
        alemai: string;
        deepseek: string;
        gemini: string;
        groq: string;
    };
    providerOrder: import("../db/schema").AiProvider[];
    modelPriority: ModelPriorityItem[];
    defaultProvider: string | null;
    fallbackEnabled: boolean;
}>;
export declare function checkPromptGuard(content: string): Promise<{
    isSafe: boolean;
    score: number;
}>;
export {};
