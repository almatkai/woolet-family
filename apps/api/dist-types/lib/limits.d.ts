export declare const TEST_MODE_LIMITS: {
    transactions: number;
    mortgages: number;
    deposits: number;
    debts: number;
    accounts: number;
    subscriptions: number;
};
export declare const PRODUCTION_LIMITS: {
    transactions: number;
    mortgages: number;
    deposits: number;
    debts: number;
    accounts: number;
    subscriptions: number;
};
export type EntityType = 'transactions' | 'mortgages' | 'deposits' | 'debts' | 'accounts' | 'subscriptions';
export declare function checkEntityLimit(db: any, userId: string, entityType: EntityType): Promise<void>;
