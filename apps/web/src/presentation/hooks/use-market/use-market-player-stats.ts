"use client";

import type { MarketPlayerStatsView } from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey } from "@/infrastructure/time/stats-day";
import {
	marketDepartmentsKey,
	marketSummaryPath,
} from "@/presentation/hooks/use-market/use-market-summary";

export const marketPlayerStatsQueryKey = (
	marketId: string | null = null,
	departments: readonly GameDepartment[] = [],
) =>
	[
		"market-summary",
		"players",
		marketId ?? "all",
		marketDepartmentsKey(departments),
		statsDayKey(),
	] as const;

export function marketPlayerStatsQueryOptions(
	marketId: string | null = null,
	enabled = true,
	departments: readonly GameDepartment[] = [],
) {
	return {
		queryKey: marketPlayerStatsQueryKey(marketId, departments),
		queryFn: () =>
			apiClient.get<MarketPlayerStatsView>(marketSummaryPath("/players", marketId, departments)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketPlayerStats(
	marketId: string | null = null,
	enabled = true,
	departments: readonly GameDepartment[] = [],
) {
	return useQuery(marketPlayerStatsQueryOptions(marketId, enabled, departments));
}
