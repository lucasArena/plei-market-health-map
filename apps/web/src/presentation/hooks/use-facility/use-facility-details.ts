"use client";

import type { FacilityDetailView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";

export const facilityDetailsQueryKey = (facilityId: string | null) =>
	["facilities", "detail", facilityId, statsDayKey()] as const;

export function useFacilityDetails(facilityId: string | null) {
	return useQuery({
		queryKey: facilityDetailsQueryKey(facilityId),
		queryFn: () =>
			apiClient.get<FacilityDetailView>(
				withStatsTimeZone(`/api/v1/facilities/${encodeURIComponent(facilityId ?? "")}`),
			),
		enabled: facilityId !== null,
	});
}
