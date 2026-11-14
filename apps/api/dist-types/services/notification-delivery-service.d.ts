export interface ChannelNotificationPayload {
    userId: string;
    title: string;
    message: string;
    url?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    forcePush?: boolean;
}
export declare function deliverNotificationChannels(payload: ChannelNotificationPayload): Promise<{
    pushSent: number;
    emailSent: boolean;
    skipped: boolean;
}>;
