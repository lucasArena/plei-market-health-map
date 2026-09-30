"use client";

import type { MarketSummaryView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const marketSummaryQueryKey = (marketId: string | null = null) =>
	["market-summary", "reservations", marketId ?? "all"] as const;

export function marketSummaryPath(
	resource: "" | "/players" | "/insights",
	marketId: string | null,
) {
	const query = marketId === null ? "" : `?market=${encodeURIComponent(marketId)}`;
	return `/api/v1/market-summary${resource}${query}`;
}

export function marketSummaryQueryOptions(marketId: string | null = null, enabled = true) {
	return {
		queryKey: marketSummaryQueryKey(marketId),
		queryFn: () => apiClient.get<MarketSummaryView>(marketSummaryPath("", marketId)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketSummary(marketId: string | null = null, enabled = true) {
	return useQuery(marketSummaryQueryOptions(marketId, enabled));
}
