import { FeatureFlags, SubscriptionTier } from '@woolet/shared';
/**
 * @deprecated Use hasFeature from @woolet/shared directly
 */
export declare function checkFeatureAccess(userTier: string, feature: 'currencyWidget' | 'aiMarketDigest'): boolean;
/**
 * Check feature access with new unified config
 */
export declare function checkFeature(userTier: string, feature: keyof FeatureFlags): {
    allowed: boolean;
    reason?: string;
    upgradeTarget?: SubscriptionTier;
};
export declare function throwUpgradeError(feature: string, currentTier: string): void;
export declare function getAiDigestLength(userTier: string): 'short' | 'complete' | null;
