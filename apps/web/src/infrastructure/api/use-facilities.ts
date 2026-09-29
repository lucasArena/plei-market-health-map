"use client";

import type { FacilityPointView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const facilitiesQueryKey = ["facilities"] as const;

export function useFacilities() {
	return useQuery({
		queryKey: facilitiesQueryKey,
		queryFn: () => apiClient.get<FacilityPointView[]>("/api/v1/facilities"),
	});
}
