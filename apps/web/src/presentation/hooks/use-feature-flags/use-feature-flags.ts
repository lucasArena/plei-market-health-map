"use client";

import type { EnabledFeatureFlagsView, FeatureFlagKey } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const FEATURE_FLAGS_STALE_TIME_MS = 30 * 1000;

export const featureFlagsQueryKey = ["feature-flags"] as const;

export function useFeatureFlags() {
	return useQuery({
		queryKey: featureFlagsQueryKey,
		queryFn: () => apiClient.get<EnabledFeatureFlagsView>("/api/v1/feature-flags"),
		staleTime: FEATURE_FLAGS_STALE_TIME_MS,
	});
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
	const { data } = useFeatureFlags();
	return process.env.NODE_ENV === "development" || (data?.enabled.includes(key) ?? false);
}
