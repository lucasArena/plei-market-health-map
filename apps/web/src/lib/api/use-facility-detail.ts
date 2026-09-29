"use client";

import type { FacilityDetailView } from "@market-health-map/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export const facilityDetailQueryKey = (facilityId: string | null) =>
	["facilities", "detail", facilityId] as const;

export function useFacilityDetail(facilityId: string | null) {
	return useQuery({
		queryKey: facilityDetailQueryKey(facilityId),
		queryFn: () =>
			apiClient.get<FacilityDetailView>(
				`/api/v1/facilities/${encodeURIComponent(facilityId ?? "")}`,
			),
		enabled: facilityId !== null,
	});
}
