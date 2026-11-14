import type { ChatAttachment } from './chat-service';
export declare function persistChatAttachments(input: {
    userId: string;
    sessionId: string;
    attachments: ChatAttachment[];
}): Promise<{
    name: string;
    mimeType: string;
    key: string;
    size: number;
    storedSize: number;
    retentionUntil: string;
}[]>;
