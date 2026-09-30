"use client";

import type { FacilityPlayerStatsView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

const FACILITY_STATS_STALE_TIME_MS = 5 * 60 * 1000;

export const facilityPlayerStatsQueryKey = (facilityId: string | null) =>
	["facilities", "detail", facilityId, "players"] as const;

export function facilityPlayerStatsQueryOptions(facilityId: string | null) {
	return {
		queryKey: facilityPlayerStatsQueryKey(facilityId),
		queryFn: () =>
			apiClient.get<FacilityPlayerStatsView>(
				`/api/v1/facilities/${encodeURIComponent(facilityId ?? "")}/players`,
			),
		enabled: facilityId !== null,
		staleTime: FACILITY_STATS_STALE_TIME_MS,
	};
}

export function useFacilityPlayerStats(facilityId: string | null) {
	return useQuery(facilityPlayerStatsQueryOptions(facilityId));
}
