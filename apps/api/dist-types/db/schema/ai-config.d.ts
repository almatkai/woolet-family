export interface ModelSettings {
    openrouter?: {
        model: string;
        enabled: boolean;
    };
    openai?: {
        model: string;
        enabled: boolean;
    };
    alemai?: {
        model: string;
        enabled: boolean;
    };
    deepseek?: {
        model: string;
        enabled: boolean;
    };
    groq?: {
        model: string;
        enabled: boolean;
    };
    gemini?: {
        model: string;
        enabled: boolean;
    };
}
export interface ModelPriorityItem {
    id: string;
    provider: AiProvider;
    model: string;
    enabled: boolean;
}
export declare const aiConfig: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "ai_config";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "ai_config";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        providerOrder: import("drizzle-orm/pg-core").PgColumn<{
            name: "provider_order";
            tableName: "ai_config";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        defaultProvider: import("drizzle-orm/pg-core").PgColumn<{
            name: "default_provider";
            tableName: "ai_config";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        modelSettings: import("drizzle-orm/pg-core").PgColumn<{
            name: "model_settings";
            tableName: "ai_config";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        modelPriority: import("drizzle-orm/pg-core").PgColumn<{
            name: "model_priority";
            tableName: "ai_config";
            dataType: "json";
            columnType: "PgJsonb";
            data: ModelPriorityItem[];
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: ModelPriorityItem[];
        }>;
        fallbackEnabled: import("drizzle-orm/pg-core").PgColumn<{
            name: "fallback_enabled";
            tableName: "ai_config";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "ai_config";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "ai_config";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const defaultAiConfig: {
    id: string;
    providerOrder: string[];
    defaultProvider: string;
    modelSettings: {
        alemai: {
            model: string;
            enabled: boolean;
        };
        deepseek: {
            model: string;
            enabled: boolean;
        };
        openrouter: {
            model: string;
            enabled: boolean;
        };
        openai: {
            model: string;
            enabled: boolean;
        };
        groq: {
            model: string;
            enabled: boolean;
        };
        gemini: {
            model: string;
            enabled: boolean;
        };
    };
    modelPriority: ({
        id: string;
        provider: "alemai";
        model: string;
        enabled: true;
    } | {
        id: string;
        provider: "deepseek";
        model: string;
        enabled: true;
    } | {
        id: string;
        provider: "openai";
        model: string;
        enabled: true;
    } | {
        id: string;
        provider: "openrouter";
        model: string;
        enabled: true;
    } | {
        id: string;
        provider: "groq";
        model: string;
        enabled: true;
    } | {
        id: string;
        provider: "gemini";
        model: string;
        enabled: true;
    })[];
    fallbackEnabled: boolean;
};
export type AiConfig = typeof aiConfig.$inferSelect & {
    providerOrder: AiProvider[];
    modelSettings: ModelSettings;
    modelPriority: ModelPriorityItem[];
};
export type AiConfigInsert = typeof aiConfig.$inferInsert & {
    providerOrder?: AiProvider[];
    modelSettings?: ModelSettings;
};
export type AiProvider = 'openrouter' | 'openai' | 'alemai' | 'deepseek' | 'gemini' | 'groq';
