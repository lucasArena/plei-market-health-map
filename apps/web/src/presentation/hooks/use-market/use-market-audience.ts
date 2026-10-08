"use client";

import type { MarketAudienceView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey } from "@/infrastructure/time/stats-day";
import { marketSummaryPath } from "@/presentation/hooks/use-market/use-market-summary";

export const marketAudienceQueryKey = (marketId: string | null = null) =>
	["market-summary", "audience", marketId ?? "all", statsDayKey()] as const;

export function marketAudienceQueryOptions(marketId: string | null = null, enabled = true) {
	return {
		queryKey: marketAudienceQueryKey(marketId),
		queryFn: () => apiClient.get<MarketAudienceView>(marketSummaryPath("/audience", marketId)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketAudience(marketId: string | null = null, enabled = true) {
	return useQuery(marketAudienceQueryOptions(marketId, enabled));
}
