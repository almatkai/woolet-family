import * as schema from '../db/schema';
export declare const userRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
            db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
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
