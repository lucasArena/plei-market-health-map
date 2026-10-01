"use client";

import type {
	AppSessionFilterOptions,
	AppSessionFilters,
	AppSessionHeatmapCellView,
} from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export type { AppSessionFilterOptions, AppSessionFilters, AppSessionHeatmapCellView };

export const appSessionHeatmapQueryKey = ["app-session-heatmap"] as const;

export function useAppSessionFilterOptions(enabled: boolean) {
	return useQuery({
		queryKey: ["app-session-filter-options"],
		queryFn: () => apiClient.get<AppSessionFilterOptions>("/api/v1/app-session-heatmap/filters"),
		enabled,
		staleTime: 5 * 60 * 1000,
		retry: false,
	});
}

export function useAppSessionHeatmap(filters: AppSessionFilters = {}, enabled = true) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined) params.set(key, String(value));
	}
	const suffix = params.size ? `?${params}` : "";
	return useQuery({
		queryKey: [...appSessionHeatmapQueryKey, filters],
		queryFn: () =>
			apiClient.get<AppSessionHeatmapCellView[]>(`/api/v1/app-session-heatmap${suffix}`),
		enabled,
		staleTime: 5 * 60 * 1000,
		retry: false,
	});
}
