export declare class DigestService {
    private getTodayDate;
    private getSecondsUntilEndOfDay;
    private getSpecsHash;
    private generateAndStoreDailyDigest;
    getDailyDigest(userId: string, digestLength: 'short' | 'complete', digestDate?: string): Promise<string>;
    cacheDigestForDate(userId: string, digestDate: string, digest: string): Promise<void>;
    regenerateDigest(userId: string, digestLength: 'short' | 'complete', specs: string, digestDateInput?: string): Promise<string>;
    getRemainingCustomDigestCount(userId: string, digestDateInput?: string): Promise<number>;
    private generateDigestText;
}
export declare const digestService: DigestService;
