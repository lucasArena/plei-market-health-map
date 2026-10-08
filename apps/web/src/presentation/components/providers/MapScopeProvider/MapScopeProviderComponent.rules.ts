"use client";

import { DEFAULT_STATS_PERIOD, type StatsPeriod } from "@market-health-map/core/application";
import { useMemo, useState } from "react";
import type {
	MapNavigation,
	MapScope,
	MapScopeContextValue,
	MetricMapFocus,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

export const ALL_MARKETS_SCOPE: MapScope = { kind: "all" };

export function useMapScopeProviderRules(): MapScopeContextValue {
	const [metricFocus, setMetricFocus] = useState<MetricMapFocus | null>(null);
	const [mapNavigation, setMapNavigation] = useState<MapNavigation | null>(null);
	const [scope, setScope] = useState<MapScope>(ALL_MARKETS_SCOPE);
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
	const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
	return useMemo(
		() => ({
			scope,
			setScope,
			metricFocus,
			setMetricFocus,
			mapNavigation,
			setMapNavigation,
			selectedFacilityId,
			setSelectedFacilityId,
			period,
			setPeriod,
		}),
		[scope, selectedFacilityId, period, metricFocus, mapNavigation],
	);
}
