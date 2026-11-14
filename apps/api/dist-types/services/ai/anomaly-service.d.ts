export declare class AnomalyService {
    private formatCurrencyAmount;
    detectSpendingAnomalies(userId: string, isTestMode: boolean, defaultCurrency?: string): Promise<string | null>;
}
export declare const anomalyService: AnomalyService;
