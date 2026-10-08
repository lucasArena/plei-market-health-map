"use client";

import type { MarketSummaryView } from "@market-health-map/core/application";
import { type GameDepartment, normalizeGameDepartments } from "@market-health-map/core/domain";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";

export function marketDepartmentsKey(departments: readonly GameDepartment[] = []): string {
	const selected = normalizeGameDepartments(departments);
	return selected.length > 0 ? selected.join(",") : "all";
}

export function setMarketDepartments(
	params: URLSearchParams,
	departments: readonly GameDepartment[] = [],
): URLSearchParams {
	const selected = normalizeGameDepartments(departments);
	if (selected.length > 0) params.set("departments", selected.join(","));
	return params;
}

export const marketSummaryQueryKey = (
	marketId: string | null = null,
	departments: readonly GameDepartment[] = [],
) =>
	[
		"market-summary",
		"reservations",
		marketId ?? "all",
		marketDepartmentsKey(departments),
		statsDayKey(),
	] as const;

export function marketSummaryPath(
	resource: "" | "/players" | "/audience",
	marketId: string | null,
	departments: readonly GameDepartment[] = [],
) {
	const selected = normalizeGameDepartments(departments);
	const parts = [
		...(marketId === null ? [] : [`market=${encodeURIComponent(marketId)}`]),
		...(selected.length > 0 ? [`departments=${encodeURIComponent(selected.join(","))}`] : []),
	];
	return withStatsTimeZone(
		`/api/v1/market-summary${resource}${parts.length > 0 ? `?${parts.join("&")}` : ""}`,
	);
}

export function marketSummaryQueryOptions(
	marketId: string | null = null,
	enabled = true,
	departments: readonly GameDepartment[] = [],
) {
	return {
		queryKey: marketSummaryQueryKey(marketId, departments),
		queryFn: () => apiClient.get<MarketSummaryView>(marketSummaryPath("", marketId, departments)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	};
}

export function useMarketSummary(
	marketId: string | null = null,
	enabled = true,
	departments: readonly GameDepartment[] = [],
) {
	return useQuery(marketSummaryQueryOptions(marketId, enabled, departments));
}
