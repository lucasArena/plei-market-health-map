"use client";

import type { MarketDetailView } from "@market-health-map/application";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export const marketDetailQueryKey = (marketId: string | null) =>
	["markets", "detail", marketId] as const;

export function useMarketDetail(marketId: string | null) {
	return useQuery({
		queryKey: marketDetailQueryKey(marketId),
		queryFn: () =>
			apiClient.get<MarketDetailView>(`/api/v1/markets/${encodeURIComponent(marketId ?? "")}`),
		enabled: marketId !== null,
	});
}
