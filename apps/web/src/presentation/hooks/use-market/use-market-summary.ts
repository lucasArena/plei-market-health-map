"use client";

import type { MarketSummaryView } from "@market-health-map/core/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";

export const marketSummaryQueryKey = ["market-summary", "reservations"] as const;

export function marketSummaryQueryOptions() {
	return {
		queryKey: marketSummaryQueryKey,
		queryFn: () => apiClient.get<MarketSummaryView>("/api/v1/market-summary"),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketSummary() {
	return useQuery(marketSummaryQueryOptions());
}
