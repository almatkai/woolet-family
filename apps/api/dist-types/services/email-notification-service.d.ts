export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
    html?: string;
}
export declare function isSmtpConfigured(): boolean;
export declare function sendEmailNotification(message: EmailMessage): Promise<boolean>;
