export declare class CurrencyService {
    static getRate(from: string, to: string): Promise<number>;
    static convert(amount: number, from: string, to: string): Promise<{
        convertedAmount: number;
        rate: number;
    }>;
    static getCurrencySymbol(currency: string): string;
}
