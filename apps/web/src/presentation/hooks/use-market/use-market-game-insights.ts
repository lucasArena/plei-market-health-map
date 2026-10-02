"use client";
import type { MarketGameChangeView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { marketSummaryPath } from "@/presentation/hooks/use-market/use-market-summary";

export const marketGameInsightsQueryKey = (marketId: string | null = null) =>
	["market-summary", "insights", marketId ?? "all"] as const;

export function marketGameInsightsQueryOptions(marketId: string | null = null, enabled = true) {
	return {
		queryKey: marketGameInsightsQueryKey(marketId),
		queryFn: () => apiClient.get<MarketGameChangeView[]>(marketSummaryPath("/insights", marketId)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketGameInsights(marketId: string | null, enabled: boolean) {
	return useQuery(marketGameInsightsQueryOptions(marketId, enabled));
}
