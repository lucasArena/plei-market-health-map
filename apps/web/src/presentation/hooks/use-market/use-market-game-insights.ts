"use client";
import type { MarketGameChangeView, StatsPeriod } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const marketGameInsightsQueryKey = (marketId: string | null, period: StatsPeriod) =>
	["market-summary", "insights", marketId ?? "all", period] as const;

export function marketGameInsightsPath(marketId: string | null, period: StatsPeriod): string {
	const params = new URLSearchParams({ period });
	if (marketId !== null) params.set("market", marketId);
	return `/api/v1/market-summary/insights?${params.toString()}`;
}

export function marketGameInsightsQueryOptions(
	marketId: string | null,
	period: StatsPeriod,
	enabled = true,
) {
	return {
		queryKey: marketGameInsightsQueryKey(marketId, period),
		queryFn: () => apiClient.get<MarketGameChangeView[]>(marketGameInsightsPath(marketId, period)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketGameInsights(
	marketId: string | null,
	period: StatsPeriod,
	enabled: boolean,
) {
	return useQuery(marketGameInsightsQueryOptions(marketId, period, enabled));
}
