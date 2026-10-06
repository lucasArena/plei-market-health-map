import type { FEATURE_FLAG_KEYS } from "@core/application/dtos/feature-flags-dto";

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export interface FeatureFlagRecord {
	key: string;
	enabled: boolean;
	updatedBy: string;
	updatedAt: Date;
}

export interface FeatureFlagView {
	key: string;
	enabled: boolean;
	updatedBy: string | null;
	updatedAt: string | null;
}

export interface EnabledFeatureFlagsView {
	enabled: string[];
}

export interface SetFeatureFlagInput {
	key: unknown;
	enabled: unknown;
	updatedBy: unknown;
}
