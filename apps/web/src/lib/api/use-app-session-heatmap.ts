"use client";

import type { AppSessionHeatmapCellView } from "@market-health-map/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export type { AppSessionHeatmapCellView };

export const appSessionHeatmapQueryKey = ["app-session-heatmap"] as const;

export function useAppSessionHeatmap() {
	return useQuery({
		queryKey: appSessionHeatmapQueryKey,
		queryFn: () => apiClient.get<AppSessionHeatmapCellView[]>("/api/v1/app-session-heatmap"),
		retry: false,
	});
}
