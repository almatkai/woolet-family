import { CreditLimits, CreditPeriod } from '@woolet/shared';
type CreditFeature = keyof CreditLimits;
interface UsageRecord {
    countToday: number;
    countThisWeek: number;
    countThisMonth: number;
    countLifetime: number;
    lastDailyReset: Date;
    lastWeeklyReset: Date;
    lastMonthlyReset: Date;
}
export declare class CreditService {
    private getStartOfDay;
    private getStartOfWeek;
    private getStartOfMonth;
    private needsReset;
    private getCountForPeriod;
    /**
     * Check if user has credits available for a feature
     */
    checkCredit(userId: string, userTier: string, feature: CreditFeature): Promise<{
        allowed: boolean;
        remaining: number;
        limit: number;
        message?: string;
    }>;
    /**
     * Use one credit for a feature (check and increment)
     */
    useCredit(userId: string, userTier: string, feature: CreditFeature): Promise<void>;
    /**
     * Get usage stats for a feature
     */
    getUsage(userId: string, feature: CreditFeature): Promise<UsageRecord>;
    /**
     * Increment usage counter
     */
    private incrementUsage;
    /**
     * Get remaining credits for display
     */
    getRemainingCredits(userId: string, userTier: string, feature: CreditFeature): Promise<{
        remaining: number | 'unlimited';
        limit: number | 'unlimited';
        period: CreditPeriod;
    }>;
}
export declare const creditService: CreditService;
export {};
