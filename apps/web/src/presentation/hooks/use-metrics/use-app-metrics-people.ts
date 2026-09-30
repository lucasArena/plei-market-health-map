"use client";

import type { AppMetricsPeoplePage } from "@market-health-map/core/application";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { APP_METRICS_STALE_TIME_MS } from "@/presentation/hooks/use-metrics/use-app-metrics";

export const appMetricsPeopleQueryKey = (page: number) => ["app-metrics", "people", page] as const;

export function useAppMetricsPeople(page: number) {
	return useQuery({
		queryKey: appMetricsPeopleQueryKey(page),
		queryFn: () => apiClient.get<AppMetricsPeoplePage>(`/api/v1/metrics/people?page=${page}`),
		staleTime: APP_METRICS_STALE_TIME_MS,
		placeholderData: keepPreviousData,
	});
}
