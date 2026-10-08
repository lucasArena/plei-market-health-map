"use client";
import type { MarketGameChangeView, StatsPeriod } from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import {
	marketDepartmentsKey,
	setMarketDepartments,
} from "@/presentation/hooks/use-market/use-market-summary";

export const marketGameInsightsQueryKey = (
	marketId: string | null,
	period: StatsPeriod,
	departments: readonly GameDepartment[] = [],
) =>
	[
		"market-summary",
		"insights",
		marketId ?? "all",
		period,
		marketDepartmentsKey(departments),
	] as const;

export function marketGameInsightsPath(
	marketId: string | null,
	period: StatsPeriod,
	departments: readonly GameDepartment[] = [],
): string {
	const params = new URLSearchParams({ period });
	if (marketId !== null) params.set("market", marketId);
	return `/api/v1/market-summary/insights?${setMarketDepartments(params, departments).toString()}`;
}

export function marketGameInsightsQueryOptions(
	marketId: string | null,
	period: StatsPeriod,
	enabled = true,
	departments: readonly GameDepartment[] = [],
) {
	return {
		queryKey: marketGameInsightsQueryKey(marketId, period, departments),
		queryFn: () =>
			apiClient.get<MarketGameChangeView[]>(marketGameInsightsPath(marketId, period, departments)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketGameInsights(
	marketId: string | null,
	period: StatsPeriod,
	enabled: boolean,
	departments: readonly GameDepartment[] = [],
) {
	return useQuery(marketGameInsightsQueryOptions(marketId, period, enabled, departments));
}
