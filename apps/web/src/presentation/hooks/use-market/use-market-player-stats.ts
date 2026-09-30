"use client";

import type { MarketPlayerStatsView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const marketPlayerStatsQueryKey = ["market-summary", "players"] as const;

export function marketPlayerStatsQueryOptions() {
	return {
		queryKey: marketPlayerStatsQueryKey,
		queryFn: () => apiClient.get<MarketPlayerStatsView>("/api/v1/market-summary/players"),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketPlayerStats() {
	return useQuery(marketPlayerStatsQueryOptions());
}
