import { type AiConfig } from '../../db/schema';
export declare class AiConfigService {
    /**
     * Get the current AI configuration from the database
     * Falls back to default configuration if not found
     */
    static getConfig(): Promise<AiConfig>;
    /**
     * Update the AI configuration
     */
    static updateConfig(updates: Partial<AiConfig>): Promise<AiConfig>;
    /**
     * Reset to default configuration
     */
    static resetToDefault(): Promise<AiConfig>;
    /**
     * Check if the AI config table exists and has data
     */
    static hasConfig(): Promise<boolean>;
    /**
     * Ensure the default configuration exists
     */
    static ensureDefaultConfig(): Promise<AiConfig>;
}
