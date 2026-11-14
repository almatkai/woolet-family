type CaptureContext = {
    tags?: Record<string, unknown>;
    extra?: Record<string, unknown>;
    level?: string;
    [key: string]: unknown;
};
export declare const initErrorTracking: () => void;
export declare const GlitchTip: {
    captureException(error: unknown, context?: CaptureContext): void;
    captureMessage(message: string, context?: CaptureContext): void;
    setUser(user: {
        id?: string;
    } | null): void;
};
export declare const flushEvents: () => Promise<void>;
export {};
