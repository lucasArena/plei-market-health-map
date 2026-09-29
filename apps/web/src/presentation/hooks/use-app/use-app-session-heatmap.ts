"use client";

import type { AppSessionHeatmapCellView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export type { AppSessionHeatmapCellView };

export const appSessionHeatmapQueryKey = ["app-session-heatmap"] as const;

export function useAppSessionHeatmap() {
	return useQuery({
		queryKey: appSessionHeatmapQueryKey,
		queryFn: () => apiClient.get<AppSessionHeatmapCellView[]>("/api/v1/app-session-heatmap"),
		retry: false,
	});
}
