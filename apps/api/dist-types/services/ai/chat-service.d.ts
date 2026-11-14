import { type CapabilityAction } from './capability-registry';
export interface ChatRequest {
    userId: string;
    userTier: string;
    message: string;
    sessionId?: string | null;
    attachments?: ChatAttachment[];
    settings?: {
        allowAutonomousTransactions?: boolean;
    };
}
export interface ChatAttachment {
    name: string;
    mimeType: string;
    dataUrl: string;
    qrText?: string;
}
export type ChatTraceEvent = {
    type: 'generation';
    status: 'started' | 'completed';
    provider?: string;
    model?: string;
    turn: number;
} | {
    type: 'provider_failure';
    provider: string;
    model: string;
    error: string;
    willRetry: boolean;
    nextProvider?: string;
    turn: number;
} | {
    type: 'tool_call';
    name: string;
    args: Record<string, unknown>;
    turn: number;
} | {
    type: 'tool_result';
    name: string;
    success: boolean;
    turn: number;
};
export interface ChatResponse {
    response: string;
    sessionId: string;
    clientAction: CapabilityAction | null;
    trace: ChatTraceEvent[];
}
export type ChatStreamEvent = {
    type: 'session';
    sessionId: string;
} | {
    type: 'generation_start';
    turn: number;
} | {
    type: 'generation_model';
    turn: number;
    provider: string;
    model: string;
} | {
    type: 'provider_failure';
    turn: number;
    provider: string;
    model: string;
    error: string;
    willRetry: boolean;
    nextProvider?: string;
} | {
    type: 'text_delta';
    delta: string;
} | {
    type: 'tool_call';
    turn: number;
    name: string;
    args: Record<string, unknown>;
} | {
    type: 'tool_result';
    turn: number;
    name: string;
    success: boolean;
} | {
    type: 'final';
    response: string;
    sessionId: string;
    clientAction: CapabilityAction | null;
    trace: ChatTraceEvent[];
} | {
    type: 'error';
    message: string;
};
export declare function chatWithCapabilities(request: ChatRequest): Promise<ChatResponse>;
export declare function chatWithCapabilitiesStream(request: ChatRequest, emit: (event: ChatStreamEvent) => void | Promise<void>): Promise<void>;
export declare function getChatUsageStats(userId: string, userTier: string): Promise<{
    usageToday: number;
    usageLifetime: number;
    limit: number;
    lifetimeLimit: number | undefined;
    tierTitle: string;
    isLimited: boolean;
    isFull: boolean;
    remaining: number;
}>;
export declare function listChatSessions(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    title: string;
}[]>;
export declare function getChatSessionById(userId: string, sessionId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    title: string;
    messages: {
        id: string;
        createdAt: Date;
        sessionId: string;
        role: string;
        content: string;
        trace: Record<string, unknown>[] | null;
        clientAction: Record<string, unknown> | null;
    }[];
}>;
export declare function deleteChatSessionById(userId: string, sessionId: string): Promise<{
    success: boolean;
}>;
