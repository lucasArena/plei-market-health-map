"use client";

import type { MarketHealthView } from "@market-health-map/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export const marketHealthQueryKey = ["markets", "health"] as const;

export function useMarketHealth() {
	return useQuery({
		queryKey: marketHealthQueryKey,
		queryFn: () => apiClient.get<MarketHealthView[]>("/api/v1/markets"),
	});
}
