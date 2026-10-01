import type { FeatureFlagRecord } from "@market-health-map/core/application";

export interface CachedFeatureFlags {
	expiresAt: number;
	value: Promise<FeatureFlagRecord[]>;
}
