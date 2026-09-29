"use client";

import type { FacilityPointView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const facilityListAllQueryKey = ["facilities"] as const;

export function useFacilityListAll() {
	return useQuery({
		queryKey: facilityListAllQueryKey,
		queryFn: () => apiClient.get<FacilityPointView[]>("/api/v1/facilities"),
	});
}
