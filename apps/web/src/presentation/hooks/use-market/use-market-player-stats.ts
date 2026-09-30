"use client";

import type { MarketPlayerStatsView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { marketSummaryPath } from "@/presentation/hooks/use-market/use-market-summary";

export const marketPlayerStatsQueryKey = (marketId: string | null = null) =>
	["market-summary", "players", marketId ?? "all"] as const;

export function marketPlayerStatsQueryOptions(marketId: string | null = null, enabled = true) {
	return {
		queryKey: marketPlayerStatsQueryKey(marketId),
		queryFn: () => apiClient.get<MarketPlayerStatsView>(marketSummaryPath("/players", marketId)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketPlayerStats(marketId: string | null = null, enabled = true) {
	return useQuery(marketPlayerStatsQueryOptions(marketId, enabled));
}
