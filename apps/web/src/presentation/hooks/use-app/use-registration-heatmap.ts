"use client";

import type { RegistrationHeatmapCellView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export type { RegistrationHeatmapCellView };

export const registrationHeatmapQueryKey = ["registration-heatmap"] as const;

export function useRegistrationHeatmap() {
	return useQuery({
		queryKey: registrationHeatmapQueryKey,
		queryFn: () => apiClient.get<RegistrationHeatmapCellView[]>("/api/v1/registration-heatmap"),
		retry: false,
	});
}
