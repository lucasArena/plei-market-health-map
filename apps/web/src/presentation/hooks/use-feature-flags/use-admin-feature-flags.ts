"use client";

import type { FeatureFlagView } from "@market-health-map/core/application";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import type { SetFeatureFlagRequest } from "@/presentation/hooks/use-feature-flags/use-admin-feature-flags.types";
import { featureFlagsQueryKey } from "@/presentation/hooks/use-feature-flags/use-feature-flags";

export const adminFeatureFlagsQueryKey = [...featureFlagsQueryKey, "all"] as const;

export function useAdminFeatureFlags() {
	return useQuery({
		queryKey: adminFeatureFlagsQueryKey,
		queryFn: () => apiClient.get<FeatureFlagView[]>("/api/v1/feature-flags/all"),
	});
}

export function useSetFeatureFlag() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ key, enabled }: SetFeatureFlagRequest) =>
			apiClient.put<FeatureFlagView>(`/api/v1/feature-flags/${encodeURIComponent(key)}`, {
				enabled,
			}),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: featureFlagsQueryKey }),
	});
}
