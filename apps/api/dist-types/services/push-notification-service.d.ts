export declare const VAPID_PUBLIC_KEY: string;
export declare const VAPID_PRIVATE_KEY: string;
export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    data?: Record<string, any>;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
}
export declare function sendPushNotification(userId: string, payload: PushPayload): Promise<{
    success: number;
    failed: number;
    errors: string[];
}>;
export declare function createPushSubscription(userId: string, subscription: {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}, browserName?: string, expiresAt?: Date): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isActive: boolean;
    endpoint: string;
    p256dh: string;
    auth: string;
    browserName: string | null;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
}>;
export declare function deletePushSubscription(endpoint: string): Promise<void>;
export declare function getUserPushSubscriptions(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    isActive: boolean;
    endpoint: string;
    p256dh: string;
    auth: string;
    browserName: string | null;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
}[]>;
export declare function getVapidPublicKey(): string;
