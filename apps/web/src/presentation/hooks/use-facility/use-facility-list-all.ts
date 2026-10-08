"use client";

import type { FacilityPointView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";

/** The map's facility list depends on the 7D and 28D windows, so it is keyed by the local day. */
export const facilityListAllQueryKey = () => ["facilities", statsDayKey()] as const;

export function useFacilityListAll() {
	return useQuery({
		queryKey: facilityListAllQueryKey(),
		queryFn: () => apiClient.get<FacilityPointView[]>(withStatsTimeZone("/api/v1/facilities")),
	});
}
