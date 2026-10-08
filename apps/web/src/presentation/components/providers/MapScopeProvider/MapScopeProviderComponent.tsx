"use client";

import { DEFAULT_STATS_PERIOD, type StatsPeriod } from "@market-health-map/core/application";
import { createContext, useContext, useMemo, useState } from "react";
import type {
	MapScope,
	MapScopeContextValue,
	MapScopeProviderProps,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

export const ALL_MARKETS_SCOPE: MapScope = { kind: "all" };

const MapScopeContext = createContext<MapScopeContextValue>({
	scope: ALL_MARKETS_SCOPE,
	mapNavigation: null,
	setMapNavigation: () => undefined,
	selectedFacilityId: null,
	setSelectedFacilityId: () => undefined,
	setScope: () => undefined,
	period: DEFAULT_STATS_PERIOD,
	setPeriod: () => undefined,
});

export function MapScopeProvider({ children }: Readonly<MapScopeProviderProps>) {
	const [mapNavigation, setMapNavigation] = useState<MapScope | null>(null);
	const [scope, setScope] = useState<MapScope>(ALL_MARKETS_SCOPE);
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
	const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
	const value = useMemo(
		() => ({
			scope,
			setScope,
			selectedFacilityId,
			setSelectedFacilityId,
			period,
			setPeriod,
			mapNavigation,
			setMapNavigation,
		}),
		[scope, selectedFacilityId, period, mapNavigation],
	);
	return <MapScopeContext.Provider value={value}>{children}</MapScopeContext.Provider>;
}

export function useMapScope(): MapScopeContextValue {
	return useContext(MapScopeContext);
}
