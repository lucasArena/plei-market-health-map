"use client";

import { DEFAULT_STATS_PERIOD } from "@market-health-map/core/application";
import { createContext, useContext } from "react";
import {
	ALL_MARKETS_SCOPE,
	useMapScopeProviderRules,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.rules";
import type {
	MapScopeContextValue,
	MapScopeProviderProps,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

export { ALL_MARKETS_SCOPE };

const MapScopeContext = createContext<MapScopeContextValue>({
	scope: ALL_MARKETS_SCOPE,
	metricFocus: null,
	setMetricFocus: () => undefined,
	mapNavigation: null,
	setMapNavigation: () => undefined,
	selectedFacilityId: null,
	setSelectedFacilityId: () => undefined,
	setScope: () => undefined,
	period: DEFAULT_STATS_PERIOD,
	setPeriod: () => undefined,
});

export function MapScopeProvider({ children }: Readonly<MapScopeProviderProps>) {
	const value = useMapScopeProviderRules();
	return <MapScopeContext.Provider value={value}>{children}</MapScopeContext.Provider>;
}

export function useMapScope(): MapScopeContextValue {
	return useContext(MapScopeContext);
}
