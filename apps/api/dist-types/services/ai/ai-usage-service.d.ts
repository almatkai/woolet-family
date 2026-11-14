export declare class AiUsageService {
    private static getTodayDate;
    static getUsage(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        questionCountToday: number;
        questionCountLifetime: number;
        lastResetDate: string;
    }>;
    static incrementUsage(userId: string): Promise<void>;
}
