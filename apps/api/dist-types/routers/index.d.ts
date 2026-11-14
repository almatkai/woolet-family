export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../lib/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof import("superjson").default;
}>, {
    user: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        me: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            email: string;
            name: string | null;
            username: string | null;
            defaultCurrency: string;
            subscriptionTier: "free" | "pro" | "premium";
            testMode: boolean;
            preferences: unknown;
            createdAt: Date;
            updatedAt: Date;
        } | undefined>;
        isAdmin: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, boolean>;
        searchByUsername: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                query: string;
                limit?: number | undefined;
            };
            _input_out: {
                query: string;
                limit: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            username: string | null;
            name: string | null;
        }[]>;
        getLimits: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            testMode: boolean;
            limits: {
                transactions: number;
                mortgages: number;
                deposits: number;
                debts: number;
                accounts: number;
            };
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                email: string;
                name?: string | undefined;
                username?: string | undefined;
                defaultCurrency?: string | undefined;
            };
            _input_out: {
                email: string;
                defaultCurrency: string;
                name?: string | undefined;
                username?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            email: string;
            name: string | null;
            username: string | null;
            defaultCurrency: string;
            subscriptionTier: "free" | "pro" | "premium";
            testMode: boolean;
            preferences: unknown;
            createdAt: Date;
            updatedAt: Date;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name?: string | undefined;
                username?: string | undefined;
                defaultCurrency?: string | undefined;
                testMode?: boolean | undefined;
                preferences?: {
                    weekStartsOn?: number | undefined;
                    spendingWidget?: {
                        categoryIds?: string[] | undefined;
                    } | undefined;
                    recentTransactionsWidget?: {
                        excludedCategories?: string[] | undefined;
                        period?: string | undefined;
                    } | undefined;
                    splitBill?: {
                        allowAccountSharing?: boolean | undefined;
                    } | undefined;
                } | undefined;
            };
            _input_out: {
                name?: string | undefined;
                username?: string | undefined;
                defaultCurrency?: string | undefined;
                testMode?: boolean | undefined;
                preferences?: {
                    weekStartsOn?: number | undefined;
                    spendingWidget?: {
                        categoryIds?: string[] | undefined;
                    } | undefined;
                    recentTransactionsWidget?: {
                        excludedCategories?: string[] | undefined;
                        period?: string | undefined;
                    } | undefined;
                    splitBill?: {
                        allowAccountSharing?: boolean | undefined;
                    } | undefined;
                } | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            email: string;
            name: string | null;
            username: string | null;
            defaultCurrency: string;
            subscriptionTier: "free" | "pro" | "premium";
            testMode: boolean;
            preferences: unknown;
            createdAt: Date;
            updatedAt: Date;
        }>;
        deleteAllData: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
            user: {
                id: string;
                email: string;
                name: string | null;
                username: string | null;
                defaultCurrency: string;
                subscriptionTier: "free" | "pro" | "premium";
                testMode: boolean;
                preferences: unknown;
                createdAt: Date;
                updatedAt: Date;
            };
        }>;
        deleteAccount: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        }>;
        exportAllData: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            timestamp: string;
            version: number;
            data: {
                banks: Omit<{
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    icon: string | null;
                    color: string | null;
                    isTest: boolean;
                }, "userId">[];
                accounts: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    icon: string | null;
                    type: string;
                    bankId: string;
                    last4Digits: string | null;
                }[];
                currencyBalances: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                }[];
                categories: Omit<{
                    id: string;
                    name: string;
                    createdAt: Date;
                    userId: string | null;
                    icon: string;
                    color: string;
                    type: string;
                }, "userId">[];
                transactions: {
                    date: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    exchangeRate: string;
                    type: string;
                    description: string | null;
                    currencyBalanceId: string;
                    amount: string;
                    lifecycleStatus: string;
                    debtId: string | null;
                    categoryId: string;
                    fee: string;
                    cashbackAmount: string | null;
                    toAmount: string | null;
                    toCurrencyBalanceId: string | null;
                    debtPaymentId: string | null;
                    excludeFromMonthlyStats: boolean;
                    parentTransactionId: string | null;
                    idempotencyKey: string | null;
                }[];
                debts: Omit<{
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string | null;
                    type: string;
                    description: string | null;
                    isTest: boolean;
                    currencyCode: string | null;
                    currencyBalanceId: string | null;
                    personName: string;
                    linkedUserId: string | null;
                    personContact: string | null;
                    amount: string;
                    paidAmount: string;
                    dueDate: string | null;
                    status: string;
                    lifecycleStatus: string;
                    imgUrl: string | null;
                }, "userId">[];
                debtPayments: {
                    id: string;
                    amount: string;
                    debtId: string;
                    paidAt: Date;
                    note: string | null;
                }[];
                credits: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    accountId: string;
                    status: string;
                    currency: string;
                    principalAmount: string;
                    interestRate: string;
                    monthlyPayment: string;
                    remainingBalance: string;
                    startDate: string;
                    endDate: string;
                }[];
                creditPayments: {
                    id: string;
                    amount: string;
                    paidAt: Date;
                    note: string | null;
                    creditId: string;
                    monthYear: string;
                }[];
                mortgages: {
                    id: string;
                    createdAt: Date;
                    accountId: string;
                    status: string;
                    currency: string;
                    principalAmount: string;
                    interestRate: string;
                    monthlyPayment: string;
                    remainingBalance: string;
                    startDate: string;
                    endDate: string | null;
                    propertyName: string;
                    propertyAddress: string | null;
                    termYears: number;
                    paymentDay: number | null;
                }[];
                mortgagePayments: {
                    id: string;
                    amount: string;
                    paidAt: Date;
                    note: string | null;
                    monthYear: string;
                    mortgageId: string;
                }[];
                deposits: {
                    id: string;
                    createdAt: Date;
                    accountId: string;
                    status: string;
                    currency: string;
                    principalAmount: string;
                    interestRate: string;
                    startDate: string;
                    bankName: string;
                    depositName: string;
                    currentBalance: string;
                    compoundingFrequency: string;
                    maturityDate: string | null;
                    isFlexible: boolean;
                }[];
                stocks: Omit<{
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    currency: string;
                    ticker: string;
                    exchange: string | null;
                    isManual: boolean;
                }, "userId">[];
                stockPrices: {
                    date: string;
                    id: string;
                    stockId: string;
                    open: string;
                    high: string;
                    low: string;
                    close: string;
                    adjustedClose: string;
                    volume: string | null;
                }[];
                portfolioHoldings: Omit<{
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    stockId: string;
                    quantity: string;
                    averageCostBasis: string;
                }, "userId">[];
                investmentTransactions: Omit<{
                    date: string;
                    id: string;
                    createdAt: Date;
                    userId: string;
                    type: string;
                    currency: string;
                    stockId: string;
                    quantity: string;
                    pricePerShare: string;
                    totalAmount: string;
                    notes: string | null;
                    realizedPL: string | null;
                    cashFlow: string;
                    cashBalanceAfter: string | null;
                }, "userId">[];
                subscriptions: Omit<{
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    icon: string | null;
                    color: string | null;
                    type: string;
                    description: string | null;
                    amount: string;
                    status: string;
                    currency: string;
                    startDate: string;
                    endDate: string | null;
                    frequency: string;
                    billingDay: number | null;
                    linkedEntityId: string | null;
                    linkedEntityType: string | null;
                }, "userId">[];
                subscriptionPayments: {
                    id: string;
                    createdAt: Date;
                    currencyBalanceId: string | null;
                    amount: string;
                    dueDate: Date | null;
                    paidAt: Date;
                    note: string | null;
                    transactionId: string | null;
                    subscriptionId: string;
                }[];
                splitParticipants: Omit<{
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    color: string | null;
                    linkedUserId: string | null;
                    linkedUsername: string | null;
                    contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
                    contactValue: string | null;
                    isActive: boolean;
                }, "userId">[];
                transactionSplits: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    paidAmount: string;
                    status: "pending" | "partial" | "settled";
                    note: string | null;
                    transactionId: string;
                    participantId: string;
                    owedAmount: string;
                }[];
                splitPayments: {
                    id: string;
                    createdAt: Date;
                    amount: string;
                    paidAt: Date;
                    note: string | null;
                    splitId: string;
                    receivedToCurrencyBalanceId: string | null;
                    linkedTransactionId: string | null;
                }[];
                userSettings: Omit<{
                    id: string;
                    defaultCurrency: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    paymentStatusLogic: string;
                    paymentStatusPeriod: string;
                    creditStatusLogic: string | null;
                    creditStatusPeriod: string | null;
                    mortgageStatusLogic: string | null;
                    mortgageStatusPeriod: string | null;
                    subscriptionStatusLogic: string | null;
                    subscriptionStatusPeriod: string | null;
                    notificationsEnabled: boolean;
                    browserNotificationsEnabled: boolean;
                    emailNotificationsEnabled: boolean;
                    emailNotificationAddress: string | null;
                    subscriptionReminderDays: number;
                    creditReminderDays: number;
                    mortgageReminderDays: number;
                }, "userId">[];
                dashboardLayouts: Omit<{
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    layout: unknown;
                }, "userId">[];
            };
        }>;
        importData: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                data: Record<string, Record<string, any>[]>;
                version?: number | undefined;
                timestamp?: string | undefined;
            };
            _input_out: {
                data: Record<string, Record<string, any>[]>;
                version?: number | undefined;
                timestamp?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            summary: {
                banks: number;
                accounts: number;
                currencyBalances: number;
                transactions: number;
                categories: number;
            };
        }>;
    }>;
    bank: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            icon: string | null;
            color: string | null;
            isTest: boolean;
        }[]>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                icon?: string | undefined;
                color?: string | undefined;
            };
            _input_out: {
                name: string;
                icon?: string | undefined;
                color?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            icon: string | null;
            color: string | null;
            isTest: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                color?: string | undefined;
            };
            _input_out: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                color?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            userId: string;
            name: string;
            icon: string | null;
            color: string | null;
            isTest: boolean;
            createdAt: Date;
            updatedAt: Date;
        }>;
        getHierarchy: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, ({
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            icon: string | null;
            color: string | null;
            isTest: boolean;
        } & {
            accounts: Array<{
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
            } & {
                currencyBalances: Array<{
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                }>;
            }>;
        })[]>;
        getLimitsAndUsage: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tier: import("@woolet/shared").SubscriptionTier;
            display: import("@woolet/shared").DisplayConfig;
            features: import("@woolet/shared").FeatureFlags;
            credits: import("@woolet/shared").CreditLimits;
            dataLimits: import("@woolet/shared").DataLimits;
            limits: {
                banks: string;
                accountsPerBank: string;
                currenciesPerAccount: string;
                transactionHistoryDays: string;
                totalStocks: number;
                aiQuestionsPerDay: number;
                aiQuestionsLifetime: string | number;
                aiDigestRegeneratePerDay: number;
                aiDigestLength: "short" | "complete" | null;
            };
            usage: {
                banks: number;
            };
            canUpgrade: boolean;
        }>;
    }>;
    account: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                bankId?: string | undefined;
            };
            _input_out: {
                bankId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            bank: {
                id: string;
                name: string;
                icon: string | null;
                color: string | null;
            };
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
            type: string;
            bankId: string;
            last4Digits: string | null;
            currencyBalances: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                currencyCode: string;
                balance: string;
            }[];
        }[]>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                type: "cash" | "card" | "crypto" | "investment" | "checking" | "savings";
                bankId: string;
                icon?: string | undefined;
                last4Digits?: string | undefined;
            };
            _input_out: {
                name: string;
                type: "cash" | "card" | "crypto" | "investment" | "checking" | "savings";
                bankId: string;
                icon?: string | undefined;
                last4Digits?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            icon: string | null;
            type: string;
            bankId: string;
            last4Digits: string | null;
        }>;
        createWithBalance: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                currencyCode: string;
                account: {
                    name: string;
                    type: "cash" | "card" | "crypto" | "investment" | "checking" | "savings";
                    icon?: string | undefined;
                    last4Digits?: string | undefined;
                };
                bank: {
                    id: string;
                    mode: "existing";
                } | {
                    name: string;
                    mode: "new";
                    icon?: string | undefined;
                    color?: string | undefined;
                };
                initialBalance?: number | undefined;
            };
            _input_out: {
                currencyCode: string;
                account: {
                    name: string;
                    type: "cash" | "card" | "crypto" | "investment" | "checking" | "savings";
                    icon?: string | undefined;
                    last4Digits?: string | undefined;
                };
                bank: {
                    id: string;
                    mode: "existing";
                } | {
                    name: string;
                    mode: "new";
                    icon?: string | undefined;
                    color?: string | undefined;
                };
                initialBalance: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            bank: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                icon: string | null;
                color: string | null;
                isTest: boolean;
            };
            account: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
            };
            balance: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                accountId: string;
                currencyCode: string;
                balance: string;
            };
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                last4Digits?: string | undefined;
            };
            _input_out: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                last4Digits?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        addCurrency: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                accountId: string;
                currencyCode: string;
                initialBalance?: number | undefined;
            };
            _input_out: {
                accountId: string;
                currencyCode: string;
                initialBalance: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            currencyCode: string;
            balance: string;
        }>;
        getTotalBalance: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            accountCount: number;
            balances: Record<string, number>;
        }>;
        adjustBalance: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                currencyBalanceId: string;
                newBalance: number;
                reason?: string | undefined;
            };
            _input_out: {
                currencyBalanceId: string;
                newBalance: number;
                reason?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
    }>;
    currency: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _ctx_out: import("../lib/trpc").Context;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            symbol: string;
            name: string;
            code: string;
            decimalPlaces: number;
            exchangeRate: string;
        }[]>;
        getExchangeRates: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                baseCurrency?: string | undefined;
            };
            _input_out: {
                baseCurrency: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, Record<string, number>>;
        getRateHistory: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                fromCurrency: string;
                toCurrency: string;
                days?: number | undefined;
            };
            _input_out: {
                fromCurrency: string;
                toCurrency: string;
                days: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            date: string;
            rate: number;
        }[]>;
        convert: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                amount: number;
                fromCurrency: string;
                toCurrency: string;
            };
            _input_out: {
                amount: number;
                fromCurrency: string;
                toCurrency: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, number>;
        getMajorCurrencies: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, string[]>;
        addManualRate: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                fromCurrency: string;
                toCurrency: string;
                rate: number;
                date?: string | undefined;
            };
            _input_out: {
                fromCurrency: string;
                toCurrency: string;
                rate: number;
                date?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            date: string;
            id: string;
            createdAt: Date;
            fromCurrency: string;
            toCurrency: string;
            rate: string;
        }>;
    }>;
    category: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            icon: string;
            color: string;
            type: string;
        }[]>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                icon: string;
                color: string;
                type?: "income" | "expense" | "transfer" | undefined;
            };
            _input_out: {
                name: string;
                icon: string;
                color: string;
                type?: "income" | "expense" | "transfer" | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            icon: string;
            color: string;
            type: string;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                color?: string | undefined;
                type?: "income" | "expense" | "transfer" | undefined;
            };
            _input_out: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                color?: string | undefined;
                type?: "income" | "expense" | "transfer" | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            userId: string | null;
            name: string;
            icon: string;
            color: string;
            type: string;
            createdAt: Date;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
    }>;
    transaction: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                type?: "income" | "expense" | "transfer" | undefined;
                currencyBalanceId?: string | undefined;
                startDate?: string | undefined;
                endDate?: string | undefined;
                limit?: number | undefined;
                cursor?: string | null | undefined;
                excludeFromStats?: boolean | undefined;
                hideAdjustments?: boolean | undefined;
                includeChildren?: boolean | undefined;
            };
            _input_out: {
                limit: number;
                type?: "income" | "expense" | "transfer" | undefined;
                currencyBalanceId?: string | undefined;
                startDate?: string | undefined;
                endDate?: string | undefined;
                cursor?: string | null | undefined;
                excludeFromStats?: boolean | undefined;
                hideAdjustments?: boolean | undefined;
                includeChildren?: boolean | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            transactions: {
                date: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                exchangeRate: string;
                type: string;
                description: string | null;
                currencyBalanceId: string;
                amount: string;
                lifecycleStatus: string;
                debtId: string | null;
                categoryId: string;
                fee: string;
                cashbackAmount: string | null;
                toAmount: string | null;
                toCurrencyBalanceId: string | null;
                debtPaymentId: string | null;
                excludeFromMonthlyStats: boolean;
                parentTransactionId: string | null;
                idempotencyKey: string | null;
                currencyBalance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                    account: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        icon: string | null;
                        type: string;
                        bankId: string;
                        last4Digits: string | null;
                        bank: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            icon: string | null;
                            color: string | null;
                            isTest: boolean;
                        };
                    };
                    currency: {
                        symbol: string;
                        name: string;
                        code: string;
                        decimalPlaces: number;
                        exchangeRate: string;
                    };
                };
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    userId: string | null;
                    icon: string;
                    color: string;
                    type: string;
                };
                childTransactions: {
                    date: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    exchangeRate: string;
                    type: string;
                    description: string | null;
                    currencyBalanceId: string;
                    amount: string;
                    lifecycleStatus: string;
                    debtId: string | null;
                    categoryId: string;
                    fee: string;
                    cashbackAmount: string | null;
                    toAmount: string | null;
                    toCurrencyBalanceId: string | null;
                    debtPaymentId: string | null;
                    excludeFromMonthlyStats: boolean;
                    parentTransactionId: string | null;
                    idempotencyKey: string | null;
                    currencyBalance: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        accountId: string;
                        currencyCode: string;
                        balance: string;
                        account: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            icon: string | null;
                            type: string;
                            bankId: string;
                            last4Digits: string | null;
                            bank: {
                                id: string;
                                name: string;
                                createdAt: Date;
                                updatedAt: Date;
                                userId: string;
                                icon: string | null;
                                color: string | null;
                                isTest: boolean;
                            };
                        };
                        currency: {
                            symbol: string;
                            name: string;
                            code: string;
                            decimalPlaces: number;
                            exchangeRate: string;
                        };
                    };
                    category: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        userId: string | null;
                        icon: string;
                        color: string;
                        type: string;
                    };
                }[];
                splits: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    paidAmount: string;
                    status: "pending" | "partial" | "settled";
                    note: string | null;
                    transactionId: string;
                    participantId: string;
                    owedAmount: string;
                    participant: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        color: string | null;
                        linkedUserId: string | null;
                        linkedUsername: string | null;
                        contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
                        contactValue: string | null;
                        isActive: boolean;
                    };
                }[];
            }[];
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date: string;
                type: "income" | "expense" | "transfer";
                currencyBalanceId: string;
                amount: number;
                split?: {
                    participantIds: string[];
                    equalSplit?: boolean | undefined;
                    paybackCurrencyBalanceId?: string | undefined;
                    amounts?: {
                        amount: number;
                        participantId: string;
                        paybackCurrencyBalanceId?: string | undefined;
                    }[] | undefined;
                    includeSelf?: boolean | undefined;
                    instantMoneyBack?: boolean | undefined;
                } | undefined;
                exchangeRate?: number | undefined;
                description?: string | undefined;
                categoryId?: string | undefined;
                fee?: number | undefined;
                cashbackAmount?: number | undefined;
                toCurrencyBalanceId?: string | undefined;
                parentTransactionId?: string | undefined;
                idempotencyKey?: string | undefined;
            };
            _input_out: {
                date: string;
                type: "income" | "expense" | "transfer";
                currencyBalanceId: string;
                amount: number;
                split?: {
                    equalSplit: boolean;
                    participantIds: string[];
                    includeSelf: boolean;
                    paybackCurrencyBalanceId?: string | undefined;
                    amounts?: {
                        amount: number;
                        participantId: string;
                        paybackCurrencyBalanceId?: string | undefined;
                    }[] | undefined;
                    instantMoneyBack?: boolean | undefined;
                } | undefined;
                exchangeRate?: number | undefined;
                description?: string | undefined;
                categoryId?: string | undefined;
                fee?: number | undefined;
                cashbackAmount?: number | undefined;
                toCurrencyBalanceId?: string | undefined;
                parentTransactionId?: string | undefined;
                idempotencyKey?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            date: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            exchangeRate: string;
            type: string;
            description: string | null;
            currencyBalanceId: string;
            amount: string;
            lifecycleStatus: string;
            debtId: string | null;
            categoryId: string;
            fee: string;
            cashbackAmount: string | null;
            toAmount: string | null;
            toCurrencyBalanceId: string | null;
            debtPaymentId: string | null;
            excludeFromMonthlyStats: boolean;
            parentTransactionId: string | null;
            idempotencyKey: string | null;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                date?: string | undefined;
                description?: string | undefined;
                currencyBalanceId?: string | undefined;
                amount?: number | undefined;
                categoryId?: string | undefined;
            };
            _input_out: {
                id: string;
                date?: string | undefined;
                description?: string | undefined;
                currencyBalanceId?: string | undefined;
                amount?: number | undefined;
                categoryId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        getSpendingStats: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                startDate: string;
                endDate: string;
                currencyBalanceId?: string | undefined;
                categoryId?: string | undefined;
                categoryIds?: string[] | undefined;
            };
            _input_out: {
                startDate: string;
                endDate: string;
                currencyBalanceId?: string | undefined;
                categoryId?: string | undefined;
                categoryIds?: string[] | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            timeSeriesData: Array<{
                date: string;
                amount: number;
            }>;
            categoryData: Array<{
                id: string;
                name: string;
                color: string;
                value: number;
            }>;
            total: number;
        }>;
    }>;
    debt: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                cursor?: string | null | undefined;
            };
            _input_out: {
                cursor?: string | null | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            debts: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string | null;
                type: string;
                description: string | null;
                isTest: boolean;
                currencyCode: string | null;
                currencyBalanceId: string | null;
                personName: string;
                linkedUserId: string | null;
                personContact: string | null;
                amount: string;
                paidAmount: string;
                dueDate: string | null;
                status: string;
                lifecycleStatus: string;
                imgUrl: string | null;
                currencyBalance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                    account: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        icon: string | null;
                        type: string;
                        bankId: string;
                        last4Digits: string | null;
                        bank: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            icon: string | null;
                            color: string | null;
                            isTest: boolean;
                        };
                    };
                    currency: {
                        symbol: string;
                        name: string;
                        code: string;
                        decimalPlaces: number;
                        exchangeRate: string;
                    };
                } | null;
                linkedUser: {
                    id: string;
                    name: string | null;
                    username: string | null;
                } | null;
                payments: {
                    id: string;
                    amount: string;
                    debtId: string;
                    paidAt: Date;
                    note: string | null;
                    transactions: {
                        date: string;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        exchangeRate: string;
                        type: string;
                        description: string | null;
                        currencyBalanceId: string;
                        amount: string;
                        lifecycleStatus: string;
                        debtId: string | null;
                        categoryId: string;
                        fee: string;
                        cashbackAmount: string | null;
                        toAmount: string | null;
                        toCurrencyBalanceId: string | null;
                        debtPaymentId: string | null;
                        excludeFromMonthlyStats: boolean;
                        parentTransactionId: string | null;
                        idempotencyKey: string | null;
                        currencyBalance: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            accountId: string;
                            currencyCode: string;
                            balance: string;
                            account: {
                                id: string;
                                name: string;
                                createdAt: Date;
                                updatedAt: Date;
                                icon: string | null;
                                type: string;
                                bankId: string;
                                last4Digits: string | null;
                                bank: {
                                    id: string;
                                    name: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    userId: string;
                                    icon: string | null;
                                    color: string | null;
                                    isTest: boolean;
                                };
                            };
                        };
                    }[];
                }[];
            }[];
            total: number;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                type: "i_owe" | "they_owe";
                personName: string;
                amount: number;
                description?: string | undefined;
                currencyCode?: string | null | undefined;
                currencyBalanceId?: string | null | undefined;
                linkedUserId?: string | null | undefined;
                dueDate?: string | undefined;
            };
            _input_out: {
                type: "i_owe" | "they_owe";
                personName: string;
                amount: number;
                description?: string | undefined;
                currencyCode?: string | null | undefined;
                currencyBalanceId?: string | null | undefined;
                linkedUserId?: string | null | undefined;
                dueDate?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            type: string;
            description: string | null;
            isTest: boolean;
            currencyCode: string | null;
            currencyBalanceId: string | null;
            personName: string;
            linkedUserId: string | null;
            personContact: string | null;
            amount: string;
            paidAmount: string;
            dueDate: string | null;
            status: string;
            lifecycleStatus: string;
            imgUrl: string | null;
        }>;
        listIncomingRequests: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                limit?: number | undefined;
            } | undefined;
            _input_out: {
                limit: number;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            notificationId: string;
            debtId: string;
            debtType: any;
            amount: number;
            currencyCode: any;
            personName: string;
            description: string | null;
            requesterUserId: string;
            requesterName: any;
            createdAt: Date;
        }[]>;
        respondToIncomingRequest: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                notificationId: string;
                decision: "approve" | "decline";
                currencyBalanceId?: string | undefined;
            };
            _input_out: {
                notificationId: string;
                decision: "approve" | "decline";
                currencyBalanceId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            outcome: "declined";
        } | {
            success: boolean;
            outcome: "approved";
        }>;
        addPayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                amount: number;
                debtId: string;
                paymentDate: string;
                distributions: {
                    currencyBalanceId: string;
                    amount: number;
                }[];
                note?: string | undefined;
            };
            _input_out: {
                amount: number;
                debtId: string;
                paymentDate: string;
                distributions: {
                    currencyBalanceId: string;
                    amount: number;
                }[];
                note?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                description?: string | undefined;
                personName?: string | undefined;
                amount?: number | undefined;
                dueDate?: string | undefined;
            };
            _input_out: {
                id: string;
                description?: string | undefined;
                personName?: string | undefined;
                amount?: number | undefined;
                dueDate?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        updatePayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                amount?: number | undefined;
                paidAt?: string | undefined;
                note?: string | undefined;
                distributions?: {
                    currencyBalanceId: string;
                    amount: number;
                }[] | undefined;
            };
            _input_out: {
                id: string;
                amount?: number | undefined;
                paidAt?: string | undefined;
                note?: string | undefined;
                distributions?: {
                    currencyBalanceId: string;
                    amount: number;
                }[] | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        deletePayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        softDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        } | {
            success: boolean;
            message?: undefined;
        }>;
        undoDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        } | {
            success: boolean;
            message?: undefined;
        }>;
    }>;
    credit: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            monthlyPayment: string;
            remainingBalance: string;
            startDate: string;
            endDate: string;
            payments: {
                id: string;
                amount: string;
                paidAt: Date;
                note: string | null;
                creditId: string;
                monthYear: string;
            }[];
            account: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
                currencyBalances: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                }[];
            };
        }[]>;
        getById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            monthlyPayment: string;
            remainingBalance: string;
            startDate: string;
            endDate: string;
            payments: {
                id: string;
                amount: string;
                paidAt: Date;
                note: string | null;
                creditId: string;
                monthYear: string;
            }[];
            account: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
                bank: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    icon: string | null;
                    color: string | null;
                    isTest: boolean;
                };
                currencyBalances: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                }[];
            };
        }>;
        getPaidMonths: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                creditId: string;
            };
            _input_out: {
                creditId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, string[]>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                accountId: string;
                currency: string;
                principalAmount: number;
                interestRate: number;
                monthlyPayment: number;
                remainingBalance: number;
                startDate: string;
                endDate: string;
                status?: "active" | "paid_off" | "defaulted" | undefined;
                markPastMonthsAsPaid?: boolean | undefined;
            };
            _input_out: {
                name: string;
                accountId: string;
                status: "active" | "paid_off" | "defaulted";
                currency: string;
                principalAmount: number;
                interestRate: number;
                monthlyPayment: number;
                remainingBalance: number;
                startDate: string;
                endDate: string;
                markPastMonthsAsPaid: boolean;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            monthlyPayment: string;
            remainingBalance: string;
            startDate: string;
            endDate: string;
        }>;
        markAsPaid: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                creditId: string;
                months: string[];
            };
            _input_out: {
                creditId: string;
                months: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            markedMonths: string[];
            newRemainingBalance: number;
            status: string;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                name?: string | undefined;
                status?: "active" | "paid_off" | "defaulted" | undefined;
                monthlyPayment?: number | undefined;
                remainingBalance?: number | undefined;
            };
            _input_out: {
                id: string;
                name?: string | undefined;
                status?: "active" | "paid_off" | "defaulted" | undefined;
                monthlyPayment?: number | undefined;
                remainingBalance?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        makeMonthlyPayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                creditId: string;
                months: string[];
            };
            _input_out: {
                creditId: string;
                months: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            paidMonths: string[];
            totalAmount: number;
            newAccountBalance: number;
            newRemainingBalance: number;
            status: string;
        }>;
        makePayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                amount: number;
            };
            _input_out: {
                id: string;
                amount: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            newBalance: number;
            status: string;
        }>;
    }>;
    mortgage: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            monthlyPayment: string;
            remainingBalance: string;
            startDate: string;
            endDate: string | null;
            propertyName: string;
            propertyAddress: string | null;
            termYears: number;
            paymentDay: number | null;
            payments: {
                id: string;
                amount: string;
                paidAt: Date;
                note: string | null;
                monthYear: string;
                mortgageId: string;
            }[];
            account: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
                currencyBalances: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                }[];
            };
        }[]>;
        getById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            monthlyPayment: string;
            remainingBalance: string;
            startDate: string;
            endDate: string | null;
            propertyName: string;
            propertyAddress: string | null;
            termYears: number;
            paymentDay: number | null;
            payments: {
                id: string;
                amount: string;
                paidAt: Date;
                note: string | null;
                monthYear: string;
                mortgageId: string;
            }[];
            account: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
                bank: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    icon: string | null;
                    color: string | null;
                    isTest: boolean;
                };
                currencyBalances: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                }[];
            };
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                accountId: string;
                currency: string;
                principalAmount: number;
                interestRate: number;
                monthlyPayment: number;
                remainingBalance: number;
                startDate: string;
                propertyName: string;
                termYears: number;
                status?: "active" | "paid_off" | "defaulted" | undefined;
                endDate?: string | undefined;
                propertyAddress?: string | undefined;
                paymentDay?: number | undefined;
                markPastMonthsAsPaid?: boolean | undefined;
            };
            _input_out: {
                accountId: string;
                status: "active" | "paid_off" | "defaulted";
                currency: string;
                principalAmount: number;
                interestRate: number;
                monthlyPayment: number;
                remainingBalance: number;
                startDate: string;
                propertyName: string;
                termYears: number;
                paymentDay: number;
                markPastMonthsAsPaid: boolean;
                endDate?: string | undefined;
                propertyAddress?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            monthlyPayment: string;
            remainingBalance: string;
            startDate: string;
            endDate: string | null;
            propertyName: string;
            propertyAddress: string | null;
            termYears: number;
            paymentDay: number | null;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                accountId?: string | undefined;
                status?: "active" | "paid_off" | "defaulted" | undefined;
                currency?: string | undefined;
                principalAmount?: number | undefined;
                interestRate?: number | undefined;
                monthlyPayment?: number | undefined;
                remainingBalance?: number | undefined;
                startDate?: string | undefined;
                endDate?: string | undefined;
                propertyName?: string | undefined;
                propertyAddress?: string | undefined;
                termYears?: number | undefined;
                paymentDay?: number | undefined;
            };
            _input_out: {
                id: string;
                accountId?: string | undefined;
                status?: "active" | "paid_off" | "defaulted" | undefined;
                currency?: string | undefined;
                principalAmount?: number | undefined;
                interestRate?: number | undefined;
                monthlyPayment?: number | undefined;
                remainingBalance?: number | undefined;
                startDate?: string | undefined;
                endDate?: string | undefined;
                propertyName?: string | undefined;
                propertyAddress?: string | undefined;
                termYears?: number | undefined;
                paymentDay?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        markAsPaid: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                mortgageId: string;
                months: string[];
                amountPerMonth?: number | undefined;
            };
            _input_out: {
                mortgageId: string;
                months: string[];
                amountPerMonth?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            markedMonths: string[];
            newRemainingBalance: number;
            status: string;
        }>;
        makeMonthlyPayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                mortgageId: string;
                months: string[];
                amountPerMonth?: number | undefined;
            };
            _input_out: {
                mortgageId: string;
                months: string[];
                amountPerMonth?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            paidMonths: string[];
            totalAmount: number;
            newAccountBalance: number;
            newRemainingBalance: number;
            status: string;
        }>;
        getAmortizationSchedule: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            month: number;
            monthYear: string;
            payment: number;
            principal: number;
            interest: number;
            balance: number;
            isPaid: boolean;
        }[]>;
    }>;
    deposit: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            startDate: string;
            bankName: string;
            depositName: string;
            currentBalance: string;
            compoundingFrequency: string;
            maturityDate: string | null;
            isFlexible: boolean;
        }[]>;
        getById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            startDate: string;
            bankName: string;
            depositName: string;
            currentBalance: string;
            compoundingFrequency: string;
            maturityDate: string | null;
            isFlexible: boolean;
            account: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                icon: string | null;
                type: string;
                bankId: string;
                last4Digits: string | null;
            };
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                accountId: string;
                currencyBalanceId: string;
                currency: string;
                principalAmount: number;
                interestRate: number;
                startDate: string;
                depositName: string;
                currentBalance: number;
                status?: "active" | "matured" | "withdrawn" | undefined;
                compoundingFrequency?: "monthly" | "daily" | "annually" | "quarterly" | undefined;
                maturityDate?: string | undefined;
                isFlexible?: boolean | undefined;
                skipWithdrawal?: boolean | undefined;
            };
            _input_out: {
                accountId: string;
                currencyBalanceId: string;
                status: "active" | "matured" | "withdrawn";
                currency: string;
                principalAmount: number;
                interestRate: number;
                startDate: string;
                depositName: string;
                currentBalance: number;
                compoundingFrequency: "monthly" | "daily" | "annually" | "quarterly";
                isFlexible: boolean;
                skipWithdrawal: boolean;
                maturityDate?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            accountId: string;
            status: string;
            currency: string;
            principalAmount: string;
            interestRate: string;
            startDate: string;
            bankName: string;
            depositName: string;
            currentBalance: string;
            compoundingFrequency: string;
            maturityDate: string | null;
            isFlexible: boolean;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                status?: "active" | "matured" | "withdrawn" | undefined;
                interestRate?: number | undefined;
                depositName?: string | undefined;
                currentBalance?: number | undefined;
                maturityDate?: string | undefined;
            };
            _input_out: {
                id: string;
                status?: "active" | "matured" | "withdrawn" | undefined;
                interestRate?: number | undefined;
                depositName?: string | undefined;
                currentBalance?: number | undefined;
                maturityDate?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        calculateInterest: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                months?: number | undefined;
            };
            _input_out: {
                id: string;
                months: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            currentBalance: number;
            futureValue: number;
            interestEarned: number;
            months: number;
            effectiveRate: number;
        }>;
    }>;
    dashboard: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        getSummary: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, any>;
        getLayout: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, any>;
        saveLayout: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                layouts: {
                    lg: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                    md: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                    sm: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                    xs: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                };
                hiddenWidgets?: string[] | undefined;
            };
            _input_out: {
                layouts: {
                    lg: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                    md: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                    sm: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                    xs: {
                        i: string;
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                        minW?: number | undefined;
                        maxW?: number | undefined;
                        minH?: number | undefined;
                        maxH?: number | undefined;
                    }[];
                };
                hiddenWidgets?: string[] | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        getWidgetRegistry: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, Record<string, {
            name: string;
            description: string;
            createdAt: string;
            version: string;
        }>>;
        getNewWidgets: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            newWidgets: string[];
            showAllWidgets: boolean;
        }>;
    }>;
    investing: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        searchStocks: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                query: string;
            };
            _input_out: {
                query: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@woolet/shared").StockSearchResult[]>;
        addStock: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                currency: string;
                ticker: string;
                exchange?: string | undefined;
                isManual?: boolean | undefined;
            };
            _input_out: {
                name: string;
                currency: string;
                ticker: string;
                exchange?: string | undefined;
                isManual?: boolean | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            currency: string;
            ticker: string;
            exchange: string | null;
            isManual: boolean;
        }>;
        updateManualPrice: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date: string;
                stockId: string;
                price: number;
            };
            _input_out: {
                date: string;
                stockId: string;
                price: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        getPortfolioSummary: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@woolet/shared").PortfolioSummary>;
        getPortfolioChart: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";
            };
            _input_out: {
                range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@woolet/shared").PortfolioChartPoint[]>;
        getBenchmarkComparison: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";
            };
            _input_out: {
                range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@woolet/shared").BenchmarkComparison>;
        buyStock: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date: string;
                currency: string;
                stockId: string;
                quantity: number;
                pricePerShare: number;
                notes?: string | undefined;
            };
            _input_out: {
                date: string;
                currency: string;
                stockId: string;
                quantity: number;
                pricePerShare: number;
                notes?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        sellStock: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date: string;
                currency: string;
                stockId: string;
                quantity: number;
                pricePerShare: number;
                notes?: string | undefined;
            };
            _input_out: {
                date: string;
                currency: string;
                stockId: string;
                quantity: number;
                pricePerShare: number;
                notes?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            realizedPL: number;
        }>;
        getTransactions: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                stockId?: string | undefined;
            };
            _input_out: {
                stockId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            date: string;
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            currency: string;
            stockId: string;
            quantity: string;
            pricePerShare: string;
            totalAmount: string;
            notes: string | null;
            realizedPL: string | null;
            cashFlow: string;
            cashBalanceAfter: string | null;
            stock: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                currency: string;
                ticker: string;
                exchange: string | null;
                isManual: boolean;
            };
        }[]>;
        getStockPriceHistory: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                stockId: string;
                range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";
            };
            _input_out: {
                stockId: string;
                range: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "MAX";
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@woolet/shared").StockPrice[]>;
        listStocks: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            currency: string;
            ticker: string;
            exchange: string | null;
            isManual: boolean;
        }[]>;
        deleteStock: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                stockId: string;
            };
            _input_out: {
                stockId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        deleteAllStocks: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        getQuote: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                ticker: string;
            };
            _input_out: {
                ticker: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            price: number;
            date: string;
        }>;
        getPriceForDate: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date: string;
                ticker: string;
            };
            _input_out: {
                date: string;
                ticker: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            price: number;
            date: string;
        } | null>;
        updateTransaction: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date: string;
                id: string;
                quantity: number;
                pricePerShare: number;
                notes?: string | undefined;
            };
            _input_out: {
                date: string;
                id: string;
                quantity: number;
                pricePerShare: number;
                notes?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        deleteTransaction: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        getCacheStats: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            cache: import("../lib/investing-cache").CacheStats;
        }>;
        clearCache: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        }>;
        resetCacheStats: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        }>;
        getInvestmentCashBalance: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            currency: string;
            availableBalance: string;
            settledBalance: string;
            lastUpdated: Date;
        }[]>;
        depositToInvestment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                amount: number;
                currency: string;
                notes?: string | undefined;
            };
            _input_out: {
                amount: number;
                currency: string;
                notes?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        withdrawFromInvestment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                amount: number;
                currency: string;
                notes?: string | undefined;
            };
            _input_out: {
                amount: number;
                currency: string;
                notes?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
    }>;
    subscription: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                type?: "credit" | "mortgage" | "general" | "all" | "mobile" | undefined;
                status?: "active" | "all" | "paused" | "cancelled" | undefined;
                includeLinkedEntities?: boolean | undefined;
            } | undefined;
            _input_out: {
                type: "credit" | "mortgage" | "general" | "all" | "mobile";
                status: "active" | "all" | "paused" | "cancelled";
                includeLinkedEntities: boolean;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            subscriptions: {
                isLinked: boolean;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                icon: string | null;
                color: string | null;
                type: string;
                description: string | null;
                amount: string;
                status: string;
                currency: string;
                startDate: string;
                endDate: string | null;
                frequency: string;
                billingDay: number | null;
                linkedEntityId: string | null;
                linkedEntityType: string | null;
                payments: {
                    id: string;
                    createdAt: Date;
                    currencyBalanceId: string | null;
                    amount: string;
                    dueDate: Date | null;
                    paidAt: Date;
                    note: string | null;
                    transactionId: string | null;
                    subscriptionId: string;
                    currencyBalance: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        accountId: string;
                        currencyCode: string;
                        balance: string;
                        account: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            icon: string | null;
                            type: string;
                            bankId: string;
                            last4Digits: string | null;
                        };
                    } | null;
                }[];
            }[];
            linkedItems: any[];
            total: number;
        }>;
        getById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            icon: string | null;
            color: string | null;
            type: string;
            description: string | null;
            amount: string;
            status: string;
            currency: string;
            startDate: string;
            endDate: string | null;
            frequency: string;
            billingDay: number | null;
            linkedEntityId: string | null;
            linkedEntityType: string | null;
            payments: {
                id: string;
                createdAt: Date;
                currencyBalanceId: string | null;
                amount: string;
                dueDate: Date | null;
                paidAt: Date;
                note: string | null;
                transactionId: string | null;
                subscriptionId: string;
                currencyBalance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                    account: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        icon: string | null;
                        type: string;
                        bankId: string;
                        last4Digits: string | null;
                        bank: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            icon: string | null;
                            color: string | null;
                            isTest: boolean;
                        };
                    };
                } | null;
            }[];
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                type: "credit" | "mortgage" | "general" | "mobile";
                amount: number;
                startDate: string;
                icon?: string | undefined;
                color?: string | undefined;
                description?: string | undefined;
                status?: "active" | "paused" | "cancelled" | undefined;
                currency?: string | undefined;
                endDate?: string | undefined;
                frequency?: "monthly" | "daily" | "weekly" | "yearly" | undefined;
                billingDay?: number | undefined;
                linkedEntityId?: string | undefined;
                linkedEntityType?: "credit" | "mortgage" | undefined;
            };
            _input_out: {
                name: string;
                icon: string;
                color: string;
                type: "credit" | "mortgage" | "general" | "mobile";
                amount: number;
                status: "active" | "paused" | "cancelled";
                currency: string;
                startDate: string;
                frequency: "monthly" | "daily" | "weekly" | "yearly";
                description?: string | undefined;
                endDate?: string | undefined;
                billingDay?: number | undefined;
                linkedEntityId?: string | undefined;
                linkedEntityType?: "credit" | "mortgage" | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            icon: string | null;
            color: string | null;
            type: string;
            description: string | null;
            amount: string;
            status: string;
            currency: string;
            startDate: string;
            endDate: string | null;
            frequency: string;
            billingDay: number | null;
            linkedEntityId: string | null;
            linkedEntityType: string | null;
        }>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                color?: string | undefined;
                description?: string | undefined;
                amount?: number | undefined;
                status?: "active" | "paused" | "cancelled" | undefined;
                startDate?: string | undefined;
                endDate?: string | null | undefined;
                frequency?: "monthly" | "daily" | "weekly" | "yearly" | undefined;
                billingDay?: number | undefined;
            };
            _input_out: {
                id: string;
                name?: string | undefined;
                icon?: string | undefined;
                color?: string | undefined;
                description?: string | undefined;
                amount?: number | undefined;
                status?: "active" | "paused" | "cancelled" | undefined;
                startDate?: string | undefined;
                endDate?: string | null | undefined;
                frequency?: "monthly" | "daily" | "weekly" | "yearly" | undefined;
                billingDay?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        makePayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                currencyBalanceId: string;
                amount: number;
                subscriptionId: string;
                split?: {
                    participantIds: string[];
                    equalSplit?: boolean | undefined;
                    paybackCurrencyBalanceId?: string | undefined;
                    amounts?: {
                        amount: number;
                        participantId: string;
                        paybackCurrencyBalanceId?: string | undefined;
                    }[] | undefined;
                    includeSelf?: boolean | undefined;
                    instantMoneyBack?: boolean | undefined;
                } | undefined;
                dueDate?: string | undefined;
                paidAt?: string | undefined;
                note?: string | undefined;
            };
            _input_out: {
                currencyBalanceId: string;
                amount: number;
                subscriptionId: string;
                split?: {
                    equalSplit: boolean;
                    participantIds: string[];
                    includeSelf: boolean;
                    paybackCurrencyBalanceId?: string | undefined;
                    amounts?: {
                        amount: number;
                        participantId: string;
                        paybackCurrencyBalanceId?: string | undefined;
                    }[] | undefined;
                    instantMoneyBack?: boolean | undefined;
                } | undefined;
                dueDate?: string | undefined;
                paidAt?: string | undefined;
                note?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            payment: {
                id: string;
                createdAt: Date;
                currencyBalanceId: string | null;
                amount: string;
                dueDate: Date | null;
                paidAt: Date;
                note: string | null;
                transactionId: string | null;
                subscriptionId: string;
            };
            transaction: {
                date: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                exchangeRate: string;
                type: string;
                description: string | null;
                currencyBalanceId: string;
                amount: string;
                lifecycleStatus: string;
                debtId: string | null;
                categoryId: string;
                fee: string;
                cashbackAmount: string | null;
                toAmount: string | null;
                toCurrencyBalanceId: string | null;
                debtPaymentId: string | null;
                excludeFromMonthlyStats: boolean;
                parentTransactionId: string | null;
                idempotencyKey: string | null;
            };
            newBalance: number;
        }>;
        getUpcoming: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                days?: number | undefined;
            } | undefined;
            _input_out: {
                days: number;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            subscription: any;
            dueDate: Date;
            isPaid: boolean;
        }[]>;
        getCalendarView: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                year: number;
                month: number;
            };
            _input_out: {
                year: number;
                month: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            year: number;
            month: number;
            daysInMonth: number;
            data: Record<number, {
                subscription: any;
                isPaid: boolean;
            }[]>;
        }>;
        checkAndNotifyDueSubscriptions: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                daysAhead?: number | undefined;
            } | undefined;
            _input_out: {
                daysAhead: number;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            notificationsCreated: number;
            subscriptionIds: string[];
        }>;
    }>;
    news: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        getNewsByCategory: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: import("../lib/trpc").Context;
            _input_in: {
                category: "latest" | "ai" | "oil" | "medical";
            };
            _input_out: {
                category: "latest" | "ai" | "oil" | "medical";
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/investing/news-service").NewsItem[]>;
        getNewsForTicker: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: import("../lib/trpc").Context;
            _input_in: {
                ticker: string;
            };
            _input_out: {
                ticker: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/investing/news-service").NewsItem[]>;
    }>;
    ai: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        getDailyDigest: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                date?: string | undefined;
            } | undefined;
            _input_out: {
                date?: string | undefined;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            locked: boolean;
            userTier: "free" | "pro" | "premium";
            digest: null;
            digestDate: string;
            canRegenerate: boolean;
            remainingRegenerations: number;
            regenerationLimit: number;
            message: string;
            followUps?: undefined;
        } | {
            locked: boolean;
            userTier: "free" | "pro" | "premium";
            digest: string | undefined;
            followUps: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                content: string;
                digestDate: string;
                kind: string;
                specs: string | null;
                specsHash: string | null;
            }[];
            digestDate: string;
            canRegenerate: boolean;
            remainingRegenerations: number;
            regenerationLimit: any;
            message?: undefined;
        }>;
        getAvailableDigestDates: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, string[]>;
        getDigestHistory: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            content: string;
            digestDate: string;
        }[]>;
        regenerateDigest: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                specs: string;
                date?: string | undefined;
            };
            _input_out: {
                specs: string;
                date?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            digest: string;
            digestDate: string;
            remainingRegenerations: number;
        }>;
        getSpendingAnomalies: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, string | null>;
        getChatUsage: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            usageToday: number;
            usageLifetime: number;
            limit: number;
            lifetimeLimit: number | undefined;
            tierTitle: string;
            isLimited: boolean;
            isFull: boolean;
            remaining: number;
        }>;
        listSessions: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
        }[]>;
        getSession: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                sessionId: string;
            };
            _input_out: {
                sessionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            messages: {
                id: string;
                createdAt: Date;
                sessionId: string;
                role: string;
                content: string;
                trace: Record<string, unknown>[] | null;
                clientAction: Record<string, unknown> | null;
            }[];
        }>;
        deleteSession: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                sessionId: string;
            };
            _input_out: {
                sessionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        getCapabilityManifest: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/ai/capability-registry").CapabilityManifest>;
        executeCapability: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                capabilityId: string;
                idempotencyKey?: string | undefined;
                args?: Record<string, unknown> | undefined;
                dryRun?: boolean | undefined;
                confirmationToken?: string | undefined;
            };
            _input_out: {
                capabilityId: string;
                idempotencyKey?: string | undefined;
                args?: Record<string, unknown> | undefined;
                dryRun?: boolean | undefined;
                confirmationToken?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/ai/capability-registry").CapabilityExecutionResult>;
        chat: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                message: string;
                sessionId?: string | null | undefined;
                settings?: {
                    allowAutonomousTransactions?: boolean | undefined;
                } | undefined;
                attachments?: {
                    name: string;
                    mimeType: string;
                    dataUrl: string;
                    qrText?: string | undefined;
                }[] | undefined;
            };
            _input_out: {
                message: string;
                sessionId?: string | null | undefined;
                settings?: {
                    allowAutonomousTransactions?: boolean | undefined;
                } | undefined;
                attachments?: {
                    name: string;
                    mimeType: string;
                    dataUrl: string;
                    qrText?: string | undefined;
                }[] | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../services/ai/chat-service").ChatResponse>;
        getAiConfig: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../db/schema").AiConfig>;
        getLlmModels: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            provider: string;
            modelId: string;
            displayName: string;
            contextWindow: number | null;
            inputModalities: unknown;
            outputModalities: unknown;
            supportsTools: boolean;
            supportsVision: boolean;
            isPopular: boolean;
            enabled: boolean;
            sortOrder: number;
        }[]>;
        updateAiConfig: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                providerOrder?: ("openrouter" | "openai" | "alemai" | "deepseek" | "gemini" | "groq")[] | undefined;
                defaultProvider?: "openrouter" | "openai" | "alemai" | "deepseek" | "gemini" | "groq" | undefined;
                modelSettings?: {
                    openrouter?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    openai?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    alemai?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    deepseek?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    gemini?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    groq?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                } | undefined;
                modelPriority?: {
                    id: string;
                    provider: "openrouter" | "openai" | "alemai" | "deepseek" | "gemini" | "groq";
                    enabled: boolean;
                    model: string;
                }[] | undefined;
                fallbackEnabled?: boolean | undefined;
            };
            _input_out: {
                providerOrder?: ("openrouter" | "openai" | "alemai" | "deepseek" | "gemini" | "groq")[] | undefined;
                defaultProvider?: "openrouter" | "openai" | "alemai" | "deepseek" | "gemini" | "groq" | undefined;
                modelSettings?: {
                    openrouter?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    openai?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    alemai?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    deepseek?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    gemini?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                    groq?: {
                        enabled: boolean;
                        model: string;
                    } | undefined;
                } | undefined;
                modelPriority?: {
                    id: string;
                    provider: "openrouter" | "openai" | "alemai" | "deepseek" | "gemini" | "groq";
                    enabled: boolean;
                    model: string;
                }[] | undefined;
                fallbackEnabled?: boolean | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../db/schema").AiConfig>;
        resetAiConfig: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("../db/schema").AiConfig>;
        getAiStatus: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            enabled: {
                openrouter: boolean;
                openai: boolean;
                alemai: boolean;
                deepseek: boolean;
                gemini: boolean;
                groq: boolean;
            };
            models: {
                openrouter: string;
                openai: string;
                alemai: string;
                deepseek: string;
                gemini: string;
                groq: string;
            };
            providerOrder: import("../db/schema").AiProvider[];
            modelPriority: import("../db/schema").ModelPriorityItem[];
            defaultProvider: string | null;
            fallbackEnabled: boolean;
        }>;
    }>;
    settings: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        getUserSettings: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            defaultCurrency: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            paymentStatusLogic: string;
            paymentStatusPeriod: string;
            creditStatusLogic: string | null;
            creditStatusPeriod: string | null;
            mortgageStatusLogic: string | null;
            mortgageStatusPeriod: string | null;
            subscriptionStatusLogic: string | null;
            subscriptionStatusPeriod: string | null;
            notificationsEnabled: boolean;
            browserNotificationsEnabled: boolean;
            emailNotificationsEnabled: boolean;
            emailNotificationAddress: string | null;
            subscriptionReminderDays: number;
            creditReminderDays: number;
            mortgageReminderDays: number;
        }>;
        updateUserSettings: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                defaultCurrency?: string | undefined;
                paymentStatusLogic?: string | undefined;
                paymentStatusPeriod?: string | undefined;
                creditStatusLogic?: string | null | undefined;
                creditStatusPeriod?: string | null | undefined;
                mortgageStatusLogic?: string | null | undefined;
                mortgageStatusPeriod?: string | null | undefined;
                subscriptionStatusLogic?: string | null | undefined;
                subscriptionStatusPeriod?: string | null | undefined;
                notificationsEnabled?: boolean | undefined;
                browserNotificationsEnabled?: boolean | undefined;
                emailNotificationsEnabled?: boolean | undefined;
                emailNotificationAddress?: string | null | undefined;
                subscriptionReminderDays?: number | undefined;
                creditReminderDays?: number | undefined;
                mortgageReminderDays?: number | undefined;
            };
            _input_out: {
                defaultCurrency?: string | undefined;
                paymentStatusLogic?: string | undefined;
                paymentStatusPeriod?: string | undefined;
                creditStatusLogic?: string | null | undefined;
                creditStatusPeriod?: string | null | undefined;
                mortgageStatusLogic?: string | null | undefined;
                mortgageStatusPeriod?: string | null | undefined;
                subscriptionStatusLogic?: string | null | undefined;
                subscriptionStatusPeriod?: string | null | undefined;
                notificationsEnabled?: boolean | undefined;
                browserNotificationsEnabled?: boolean | undefined;
                emailNotificationsEnabled?: boolean | undefined;
                emailNotificationAddress?: string | null | undefined;
                subscriptionReminderDays?: number | undefined;
                creditReminderDays?: number | undefined;
                mortgageReminderDays?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            defaultCurrency: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            paymentStatusLogic: string;
            paymentStatusPeriod: string;
            creditStatusLogic: string | null;
            creditStatusPeriod: string | null;
            mortgageStatusLogic: string | null;
            mortgageStatusPeriod: string | null;
            subscriptionStatusLogic: string | null;
            subscriptionStatusPeriod: string | null;
            notificationsEnabled: boolean;
            browserNotificationsEnabled: boolean;
            emailNotificationsEnabled: boolean;
            emailNotificationAddress: string | null;
            subscriptionReminderDays: number;
            creditReminderDays: number;
            mortgageReminderDays: number;
        }>;
    }>;
    splitBill: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        listParticipants: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                includeInactive?: boolean | undefined;
            } | undefined;
            _input_out: {
                includeInactive: boolean;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string | null;
            linkedUserId: string | null;
            linkedUsername: string | null;
            contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
            contactValue: string | null;
            isActive: boolean;
            linkedUser: {
                id: string;
                name: string | null;
                username: string | null;
            } | null;
        }[]>;
        getPendingSplits: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                status?: "pending" | "partial" | "settled" | undefined;
            } | undefined;
            _input_out: {
                status?: "pending" | "partial" | "settled" | undefined;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paidAmount: string;
            status: "pending" | "partial" | "settled";
            note: string | null;
            transactionId: string;
            participantId: string;
            owedAmount: string;
            payments: {
                id: string;
                createdAt: Date;
                amount: string;
                paidAt: Date;
                note: string | null;
                splitId: string;
                receivedToCurrencyBalanceId: string | null;
                linkedTransactionId: string | null;
            }[];
            transaction: {
                date: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                exchangeRate: string;
                type: string;
                description: string | null;
                currencyBalanceId: string;
                amount: string;
                lifecycleStatus: string;
                debtId: string | null;
                categoryId: string;
                fee: string;
                cashbackAmount: string | null;
                toAmount: string | null;
                toCurrencyBalanceId: string | null;
                debtPaymentId: string | null;
                excludeFromMonthlyStats: boolean;
                parentTransactionId: string | null;
                idempotencyKey: string | null;
                currencyBalance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                    account: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        icon: string | null;
                        type: string;
                        bankId: string;
                        last4Digits: string | null;
                        bank: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            icon: string | null;
                            color: string | null;
                            isTest: boolean;
                        };
                    };
                    currency: {
                        symbol: string;
                        name: string;
                        code: string;
                        decimalPlaces: number;
                        exchangeRate: string;
                    };
                };
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    userId: string | null;
                    icon: string;
                    color: string;
                    type: string;
                };
            };
            participant: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                color: string | null;
                linkedUserId: string | null;
                linkedUsername: string | null;
                contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
                contactValue: string | null;
                isActive: boolean;
            };
        }[]>;
        listIncomingRequests: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                limit?: number | undefined;
            } | undefined;
            _input_out: {
                limit: number;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            fromUser: {
                id: string;
                name: string | null;
                username: string | null;
                testMode: boolean;
                preferences: unknown;
            } | null;
            remainingAmount: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paidAmount: string;
            status: "pending" | "partial" | "settled";
            note: string | null;
            transactionId: string;
            participantId: string;
            owedAmount: string;
            payments: {
                id: string;
                createdAt: Date;
                amount: string;
                paidAt: Date;
                note: string | null;
                splitId: string;
                receivedToCurrencyBalanceId: string | null;
                linkedTransactionId: string | null;
            }[];
            transaction: {
                date: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                exchangeRate: string;
                type: string;
                description: string | null;
                currencyBalanceId: string;
                amount: string;
                lifecycleStatus: string;
                debtId: string | null;
                categoryId: string;
                fee: string;
                cashbackAmount: string | null;
                toAmount: string | null;
                toCurrencyBalanceId: string | null;
                debtPaymentId: string | null;
                excludeFromMonthlyStats: boolean;
                parentTransactionId: string | null;
                idempotencyKey: string | null;
                currencyBalance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    accountId: string;
                    currencyCode: string;
                    balance: string;
                    account: {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        icon: string | null;
                        type: string;
                        bankId: string;
                        last4Digits: string | null;
                        bank: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            icon: string | null;
                            color: string | null;
                            isTest: boolean;
                        };
                    };
                    currency: {
                        symbol: string;
                        name: string;
                        code: string;
                        decimalPlaces: number;
                        exchangeRate: string;
                    };
                };
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    userId: string | null;
                    icon: string;
                    color: string;
                    type: string;
                };
            };
            participant: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                color: string | null;
                linkedUserId: string | null;
                linkedUsername: string | null;
                contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
                contactValue: string | null;
                isActive: boolean;
            };
            receivingAccountSharingEnabled: boolean;
            receivingAccounts: {
                id: string;
                label: string;
                currencyCode: string;
            }[];
            sourceCategory: {
                id: string;
                name: string;
                type: string;
                userId: string | null;
            } | null;
            hasCategoryInMyList: boolean;
        }[]>;
        importIncomingSplitCategory: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                splitId: string;
            };
            _input_out: {
                splitId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            category: {
                id: string;
                name: string;
                createdAt: Date;
                userId: string | null;
                icon: string;
                color: string;
                type: string;
            };
            imported: boolean;
        }>;
        listPendingIncomingReceipts: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                limit?: number | undefined;
            } | undefined;
            _input_out: {
                limit: number;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            paymentId: string;
            splitId: string;
            amount: number;
            paidAt: Date;
            transactionId: string;
            transactionDescription: string;
            currencyCode: string;
            fromUser: {
                id: string;
                name: string | null;
                username: string | null;
            } | null;
            sourceCategory: {
                id: string;
                name: string;
                type: string;
                userId: string | null;
            } | null;
        }[]>;
        assignIncomingReceipt: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                currencyBalanceId: string;
                paymentId: string;
            };
            _input_out: {
                currencyBalanceId: string;
                paymentId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            transactionId: string;
        }>;
        respondToIncomingRequest: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                splitId: string;
                decision: "approve" | "disapprove";
                note?: string | undefined;
                settlement?: "debt" | "instant_payment" | undefined;
                payerCurrencyBalanceId?: string | undefined;
                receiverCurrencyBalanceId?: string | undefined;
            };
            _input_out: {
                splitId: string;
                decision: "approve" | "disapprove";
                note?: string | undefined;
                settlement?: "debt" | "instant_payment" | undefined;
                payerCurrencyBalanceId?: string | undefined;
                receiverCurrencyBalanceId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            outcome: "disapproved";
            debtIds?: undefined;
        } | {
            success: boolean;
            outcome: "instant_payment";
            debtIds?: undefined;
        } | {
            success: boolean;
            outcome: "debt";
            debtIds: {
                ownerDebtId: string;
                responderDebtId: string;
            };
        }>;
        payIncomingRequestNow: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                splitId: string;
                payerCurrencyBalanceId: string;
                amountNow: number;
                note?: string | undefined;
                receiverCurrencyBalanceId?: string | undefined;
            };
            _input_out: {
                splitId: string;
                payerCurrencyBalanceId: string;
                amountNow: number;
                note?: string | undefined;
                receiverCurrencyBalanceId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            outcome: "pay_now_full";
            debtIds?: undefined;
        } | {
            success: boolean;
            outcome: "pay_now_partial_to_debt";
            debtIds: {
                ownerDebtId: string;
                responderDebtId: string;
            };
        }>;
        getOwedSummary: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            total: number;
            byParticipant: {
                participant: any;
                totalOwed: number;
                totalPaid: number;
                remaining: number;
            }[];
        }>;
        createParticipant: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                name: string;
                username?: string | undefined;
                color?: string | undefined;
                contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | undefined;
                contactValue?: string | undefined;
            };
            _input_out: {
                name: string;
                username?: string | undefined;
                color?: string | undefined;
                contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | undefined;
                contactValue?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            color: string | null;
            linkedUserId: string | null;
            linkedUsername: string | null;
            contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
            contactValue: string | null;
            isActive: boolean;
        }>;
        updateParticipant: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                name?: string | undefined;
                username?: string | null | undefined;
                color?: string | undefined;
                contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | null | undefined;
                contactValue?: string | null | undefined;
                isActive?: boolean | undefined;
            };
            _input_out: {
                id: string;
                name?: string | undefined;
                username?: string | null | undefined;
                color?: string | undefined;
                contactType?: "email" | "telegram" | "whatsapp" | "phone" | "other" | null | undefined;
                contactValue?: string | null | undefined;
                isActive?: boolean | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            userId: string;
            name: string;
            linkedUserId: string | null;
            linkedUsername: string | null;
            contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
            contactValue: string | null;
            color: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }>;
        deleteParticipant: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        createSplits: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                transactionId: string;
                splits: {
                    participantId: string;
                    owedAmount: number;
                    note?: string | undefined;
                }[];
                totalAmount?: number | undefined;
                equalSplit?: boolean | undefined;
            };
            _input_out: {
                transactionId: string;
                splits: {
                    participantId: string;
                    owedAmount: number;
                    note?: string | undefined;
                }[];
                equalSplit: boolean;
                totalAmount?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paidAmount: string;
            status: "pending" | "partial" | "settled";
            note: string | null;
            transactionId: string;
            participantId: string;
            owedAmount: string;
        }[]>;
        getTransactionSplits: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                transactionId: string;
            };
            _input_out: {
                transactionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paidAmount: string;
            status: "pending" | "partial" | "settled";
            note: string | null;
            transactionId: string;
            participantId: string;
            owedAmount: string;
            payments: {
                id: string;
                createdAt: Date;
                amount: string;
                paidAt: Date;
                note: string | null;
                splitId: string;
                receivedToCurrencyBalanceId: string | null;
                linkedTransactionId: string | null;
            }[];
            participant: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                color: string | null;
                linkedUserId: string | null;
                linkedUsername: string | null;
                contactType: "email" | "telegram" | "whatsapp" | "phone" | "other" | null;
                contactValue: string | null;
                isActive: boolean;
            };
        }[]>;
        updateSplit: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
                note?: string | null | undefined;
                owedAmount?: number | undefined;
            };
            _input_out: {
                id: string;
                note?: string | null | undefined;
                owedAmount?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            transactionId: string;
            participantId: string;
            owedAmount: string;
            paidAmount: string;
            status: "pending" | "partial" | "settled";
            note: string | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
        deleteSplit: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        recordPayment: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                amount: number;
                splitId: string;
                date?: string | undefined;
                note?: string | undefined;
                receivedToCurrencyBalanceId?: string | undefined;
                createIncomeTransaction?: boolean | undefined;
            };
            _input_out: {
                amount: number;
                splitId: string;
                createIncomeTransaction: boolean;
                date?: string | undefined;
                note?: string | undefined;
                receivedToCurrencyBalanceId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            amount: string;
            paidAt: Date;
            note: string | null;
            splitId: string;
            receivedToCurrencyBalanceId: string | null;
            linkedTransactionId: string | null;
        }>;
        settleSplit: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                splitId: string;
                date?: string | undefined;
                note?: string | undefined;
                receivedToCurrencyBalanceId?: string | undefined;
                createIncomeTransaction?: boolean | undefined;
            };
            _input_out: {
                splitId: string;
                createIncomeTransaction: boolean;
                date?: string | undefined;
                note?: string | undefined;
                receivedToCurrencyBalanceId?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            amount: string;
            paidAt: Date;
            note: string | null;
            splitId: string;
            receivedToCurrencyBalanceId: string | null;
            linkedTransactionId: string | null;
        }>;
    }>;
    notification: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                type?: "subscription_due" | "subscription_overdue" | "subscription_paid" | "payment_reminder" | "budget_alert" | "spending_anomaly" | "investment_update" | "credit_limit" | "debt_reminder" | "general" | undefined;
                limit?: number | undefined;
                cursor?: string | undefined;
                unreadOnly?: boolean | undefined;
                readStatus?: "unread" | "read" | undefined;
            } | undefined;
            _input_out: {
                limit: number;
                unreadOnly: boolean;
                type?: "subscription_due" | "subscription_overdue" | "subscription_paid" | "payment_reminder" | "budget_alert" | "spending_anomaly" | "investment_update" | "credit_limit" | "debt_reminder" | "general" | undefined;
                cursor?: string | undefined;
                readStatus?: "unread" | "read" | undefined;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            notifications: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                type: string;
                title: string;
                message: string;
                priority: string;
                links: {
                    web?: string;
                    mobile?: string;
                    universal?: string;
                } | null;
                entityType: string | null;
                entityId: string | null;
                metadata: Record<string, any> | null;
                isRead: boolean;
                readAt: Date | null;
                actionTaken: boolean | null;
                actionTakenAt: Date | null;
            }[];
            unreadCount: number;
            nextCursor: string | undefined;
        }>;
        getById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: string;
            title: string;
            message: string;
            priority: string;
            links: {
                web?: string;
                mobile?: string;
                universal?: string;
            } | null;
            entityType: string | null;
            entityId: string | null;
            metadata: Record<string, any> | null;
            isRead: boolean;
            readAt: Date | null;
            actionTaken: boolean | null;
            actionTakenAt: Date | null;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                type: "subscription_due" | "subscription_overdue" | "subscription_paid" | "payment_reminder" | "budget_alert" | "spending_anomaly" | "investment_update" | "credit_limit" | "debt_reminder" | "general";
                title: string;
                message: string;
                priority?: "high" | "low" | "medium" | "urgent" | undefined;
                links?: {
                    web?: string | undefined;
                    mobile?: string | undefined;
                    universal?: string | undefined;
                } | undefined;
                entityType?: string | undefined;
                entityId?: string | undefined;
                metadata?: Record<string, any> | undefined;
                sendPush?: boolean | undefined;
            };
            _input_out: {
                type: "subscription_due" | "subscription_overdue" | "subscription_paid" | "payment_reminder" | "budget_alert" | "spending_anomaly" | "investment_update" | "credit_limit" | "debt_reminder" | "general";
                title: string;
                message: string;
                priority: "high" | "low" | "medium" | "urgent";
                sendPush: boolean;
                links?: {
                    web?: string | undefined;
                    mobile?: string | undefined;
                    universal?: string | undefined;
                } | undefined;
                entityType?: string | undefined;
                entityId?: string | undefined;
                metadata?: Record<string, any> | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: string;
            title: string;
            message: string;
            priority: string;
            links: {
                web?: string;
                mobile?: string;
                universal?: string;
            } | null;
            entityType: string | null;
            entityId: string | null;
            metadata: Record<string, any> | null;
            isRead: boolean;
            readAt: Date | null;
            actionTaken: boolean | null;
            actionTakenAt: Date | null;
        }>;
        markAsRead: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        markAsReadBatch: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            updatedCount: number;
        }>;
        markAllAsRead: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        markActionTaken: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        cleanup: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                daysOld?: number | undefined;
                keepUnread?: boolean | undefined;
            } | undefined;
            _input_out: {
                daysOld: number;
                keepUnread: boolean;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            deleted: number;
        }>;
        getUnreadCount: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            count: number;
        }>;
        createSubscriptionNotification: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                type: "subscription_due" | "subscription_overdue" | "subscription_paid";
                amount: number;
                currency: string;
                subscriptionId: string;
                subscriptionName: string;
                dueDate?: string | undefined;
                daysUntilDue?: number | undefined;
                sendPush?: boolean | undefined;
            };
            _input_out: {
                type: "subscription_due" | "subscription_overdue" | "subscription_paid";
                amount: number;
                currency: string;
                subscriptionId: string;
                sendPush: boolean;
                subscriptionName: string;
                dueDate?: string | undefined;
                daysUntilDue?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: string;
            title: string;
            message: string;
            priority: string;
            links: {
                web?: string;
                mobile?: string;
                universal?: string;
            } | null;
            entityType: string | null;
            entityId: string | null;
            metadata: Record<string, any> | null;
            isRead: boolean;
            readAt: Date | null;
            actionTaken: boolean | null;
            actionTakenAt: Date | null;
        }>;
    }>;
    pushSubscription: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("../lib/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof import("superjson").default;
    }>, {
        getVapidPublicKey: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            publicKey: string;
        }>;
        subscribe: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                keys: {
                    p256dh: string;
                    auth: string;
                };
                endpoint: string;
                browserName?: string | undefined;
                expirationTime?: number | null | undefined;
            };
            _input_out: {
                keys: {
                    p256dh: string;
                    auth: string;
                };
                endpoint: string;
                browserName?: string | undefined;
                expirationTime?: number | null | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        unsubscribe: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                endpoint: string;
            };
            _input_out: {
                endpoint: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            id: string;
            browserName: string | null;
            isActive: boolean;
            lastUsedAt: Date | null;
            createdAt: Date;
        }[]>;
        test: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                title?: string | undefined;
                body?: string | undefined;
            } | undefined;
            _input_out: {
                title: string;
                body: string;
            } | undefined;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: number;
            failed: number;
            errors: string[];
        }>;
        ping: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("../lib/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof import("superjson").default;
            }>;
            _meta: object;
            _ctx_out: {
                userId: string;
                user: {
                    id: string;
                    email: string;
                    name: string | null;
                    username: string | null;
                    defaultCurrency: string;
                    subscriptionTier: "free" | "pro" | "premium";
                    testMode: boolean;
                    preferences: unknown;
                    createdAt: Date;
                    updatedAt: Date;
                };
                db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof import("../db/schema")> & {
                    $client: import("postgres").Sql<{}>;
                };
                honoContext: import("hono").Context<any, any, {}>;
            };
            _input_in: {
                endpoint: string;
            };
            _input_out: {
                endpoint: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
        }>;
    }>;
}>;
export type AppRouter = typeof appRouter;
