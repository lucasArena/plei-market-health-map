"use client";

import type {
	DrillDownMeasure,
	DrillDownRange,
	DrillDownSlice,
	GetMetricDrillDownInput,
	MetricDrillDownView,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { normalizeGameDepartments } from "@market-health-map/core/domain";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/infrastructure/api/client";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";
import { marketDepartmentsKey } from "@/presentation/hooks/use-market/use-market-summary";

export function metricDrillDownQueryKey(input: {
	measure: DrillDownMeasure;
	range: DrillDownRange;
	slice: DrillDownSlice;
	marketId?: string;
	facilityId?: string;
	grain?: GetMetricDrillDownInput["grain"];
	department?: GameDepartment;
	departments?: readonly GameDepartment[];
	enabled: boolean;
}) {
	return [
		"metric-drill-down",
		input.measure,
		input.range,
		input.slice,
		input.grain ?? "range",
		input.marketId ?? "all",
		input.facilityId ?? "all",
		input.department ?? "all",
		marketDepartmentsKey(input.departments),
		input.enabled,
		statsDayKey(),
	] as const;
}

export function metricDrillDownPath(input: GetMetricDrillDownInput): string {
	const selected = normalizeGameDepartments(input.departments);
	const params = new URLSearchParams({
		measure: input.measure,
		range: input.range,
		slice: input.slice,
	});
	if (input.grain) params.set("grain", input.grain);
	if (input.marketId) params.set("marketId", input.marketId);
	if (input.facilityId) params.set("facilityId", input.facilityId);
	if (input.department) params.set("department", input.department);
	if (input.segment) params.set("segment", input.segment);
	if (selected.length > 0) params.set("departments", selected.join(","));
	return withStatsTimeZone(`/api/v1/metric-drill-down?${params.toString()}`);
}

export function useMetricDrillDown(input: GetMetricDrillDownInput & { enabled?: boolean }) {
	const enabled = input.enabled ?? true;
	return useQuery({
		queryKey: metricDrillDownQueryKey({ ...input, enabled }),
		queryFn: () => apiClient.get<MetricDrillDownView>(metricDrillDownPath(input)),
		enabled,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}
