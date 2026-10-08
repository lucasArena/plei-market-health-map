"use client";

import type { FacilityReservationDetailView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";

const FACILITY_STATS_STALE_TIME_MS = 5 * 60 * 1000;

export const facilityReservationStatsQueryKey = (facilityId: string | null) =>
	["facilities", "detail", facilityId, "reservations", statsDayKey()] as const;

export function facilityReservationStatsQueryOptions(facilityId: string | null) {
	return {
		queryKey: facilityReservationStatsQueryKey(facilityId),
		queryFn: () =>
			apiClient.get<FacilityReservationDetailView>(
				withStatsTimeZone(
					`/api/v1/facilities/${encodeURIComponent(facilityId ?? "")}/reservations`,
				),
			),
		enabled: facilityId !== null,
		staleTime: FACILITY_STATS_STALE_TIME_MS,
	};
}

export function useFacilityReservationStats(facilityId: string | null) {
	return useQuery(facilityReservationStatsQueryOptions(facilityId));
}
