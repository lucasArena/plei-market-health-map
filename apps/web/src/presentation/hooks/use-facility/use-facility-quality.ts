"use client";

import type { FacilityQualityView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";

const FACILITY_QUALITY_STALE_TIME_MS = 5 * 60 * 1000;

export const facilityQualityQueryKey = (facilityId: string | null) =>
	["facilities", "detail", facilityId, "quality", statsDayKey()] as const;

export function facilityQualityQueryOptions(facilityId: string | null, enabled = true) {
	return {
		queryKey: facilityQualityQueryKey(facilityId),
		queryFn: () =>
			apiClient.get<FacilityQualityView>(
				withStatsTimeZone(`/api/v1/facilities/${encodeURIComponent(facilityId ?? "")}/quality`),
			),
		enabled: enabled && facilityId !== null,
		staleTime: FACILITY_QUALITY_STALE_TIME_MS,
	};
}

export function useFacilityQuality(facilityId: string | null, enabled = true) {
	return useQuery(facilityQualityQueryOptions(facilityId, enabled));
}
