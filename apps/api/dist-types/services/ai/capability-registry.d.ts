declare const NAVIGATION_PATHS: readonly ["/dashboard", "/transactions", "/accounts", "/insights", "/settings", "/budget"];
type JsonSchema = {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
};
export type CapabilityAction = {
    type: 'navigate';
    path: (typeof NAVIGATION_PATHS)[number];
} | {
    type: 'prefill_transaction';
    transaction: {
        type: 'income' | 'expense' | 'transfer';
        amount?: number;
        description?: string;
        date?: string;
        currencyCode?: string;
        categoryId?: string;
        currencyBalanceId?: string;
        merchantName?: string;
        bankName?: string;
        lineItems?: Array<{
            name: string;
            quantity?: number;
            amount?: number;
            note?: string;
        }>;
    };
};
export interface CapabilityManifestItem {
    id: string;
    aliases: string[];
    description: string;
    readOnly: boolean;
    requiresConfirmation: boolean;
    introducedAt: string;
    deprecatedAt?: string;
    argsSchema: JsonSchema;
}
export interface CapabilityManifest {
    version: string;
    generatedAt: string;
    capabilities: CapabilityManifestItem[];
}
export interface CapabilityExecutionResult {
    success: boolean;
    capabilityId: string;
    aliasUsed?: string;
    readOnly?: boolean;
    data?: unknown;
    userMessage?: string;
    clientAction?: CapabilityAction;
    error?: {
        code: 'UNKNOWN_CAPABILITY' | 'INVALID_ARGS' | 'EXECUTION_ERROR';
        message: string;
        details?: unknown;
    };
}
export interface ExecuteCapabilityInput {
    userId: string;
    capabilityId: string;
    args?: Record<string, unknown>;
    dryRun?: boolean;
    confirmationToken?: string | null;
    idempotencyKey?: string | null;
}
export declare function getCapabilityManifest(): CapabilityManifest;
export declare function isCapabilityReadOnly(capabilityIdOrAlias: string): boolean;
export declare function executeCapability(input: ExecuteCapabilityInput): Promise<CapabilityExecutionResult>;
export {};
