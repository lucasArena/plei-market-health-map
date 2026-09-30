"use client";

import type { AppMetricsView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const APP_METRICS_STALE_TIME_MS = 5 * 60 * 1000;

export const appMetricsQueryKey = ["app-metrics"] as const;

export function useAppMetrics() {
	return useQuery({
		queryKey: appMetricsQueryKey,
		queryFn: () => apiClient.get<AppMetricsView>("/api/v1/metrics"),
		staleTime: APP_METRICS_STALE_TIME_MS,
	});
}
