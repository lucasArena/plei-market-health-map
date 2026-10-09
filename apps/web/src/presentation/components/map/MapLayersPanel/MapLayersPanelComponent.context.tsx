"use client";

import type { AppSessionFilters } from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { mapFiltersPreference } from "@/infrastructure/cache/local-storage/map-filters/map-filters-preference";
import { MAP_LAYERS_DEFAULTS } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.defaults";
import type {
	MapLayersProviderProps,
	MapLayersValue,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

const MapLayersContext = createContext<MapLayersValue | null>(null);

export function MapLayersProvider({ children }: Readonly<MapLayersProviderProps>) {
	const [showActiveFacilities, setShowActiveFacilities] = useState(
		MAP_LAYERS_DEFAULTS.showActiveFacilities,
	);
	const [showInactiveFacilities, setShowInactiveFacilities] = useState(
		MAP_LAYERS_DEFAULTS.showInactiveFacilities,
	);
	const [showGamesTrend, setShowGamesTrend] = useState(MAP_LAYERS_DEFAULTS.showGamesTrend);
	const [demandMetric, setDemandMetric] = useState<"sessions" | "registrations">("sessions");
	const [demandFiltersPresent, setDemandFiltersPresent] = useState(false);
	const [supplyFiltersPresent, setSupplyFiltersPresent] = useState(false);
	const [gameDepartments, setGameDepartments] = useState<GameDepartment[]>([]);
	const [supplyMetric, setSupplyMetric] = useState<"facilities" | "games">("games");
	const [showSessions, setShowSessions] = useState(MAP_LAYERS_DEFAULTS.showSessions);
	const [sessionFilters, setSessionFilters] = useState<AppSessionFilters>({
		...MAP_LAYERS_DEFAULTS.sessionFilters,
	});
	const resetLayers = useCallback(() => {
		setShowActiveFacilities(MAP_LAYERS_DEFAULTS.showActiveFacilities);
		setShowInactiveFacilities(MAP_LAYERS_DEFAULTS.showInactiveFacilities);
		setShowGamesTrend(MAP_LAYERS_DEFAULTS.showGamesTrend);
		setShowSessions(MAP_LAYERS_DEFAULTS.showSessions);
		setDemandMetric("sessions");
		setSupplyMetric("games");
		setGameDepartments([]);
		setDemandFiltersPresent(false);
		setSupplyFiltersPresent(false);
		setSessionFilters({ ...MAP_LAYERS_DEFAULTS.sessionFilters });
	}, []);
	const [isRestored, setIsRestored] = useState(false);

	useEffect(() => {
		const remembered = mapFiltersPreference.read();
		if (remembered) {
			setShowActiveFacilities(remembered.showActiveFacilities);
			setShowInactiveFacilities(remembered.showInactiveFacilities);
			setShowGamesTrend(remembered.showGamesTrend);
			setShowSessions(remembered.showSessions);
			setDemandMetric(remembered.demandMetric);
			setSupplyMetric(remembered.supplyMetric);
			setGameDepartments(remembered.gameDepartments);
			setDemandFiltersPresent(remembered.demandFiltersPresent);
			setSupplyFiltersPresent(remembered.supplyFiltersPresent);
			setSessionFilters(remembered.sessionFilters);
		}
		setIsRestored(true);
	}, []);

	useEffect(() => {
		if (!isRestored) return;
		mapFiltersPreference.remember({
			showActiveFacilities,
			showInactiveFacilities,
			showGamesTrend,
			showSessions,
			demandMetric,
			supplyMetric,
			gameDepartments,
			demandFiltersPresent,
			supplyFiltersPresent,
			sessionFilters,
		});
	}, [
		isRestored,
		demandFiltersPresent,
		demandMetric,
		gameDepartments,
		sessionFilters,
		showActiveFacilities,
		showGamesTrend,
		showInactiveFacilities,
		showSessions,
		supplyFiltersPresent,
		supplyMetric,
	]);

	const value = useMemo(
		() => ({
			demandMetric,
			setDemandMetric,
			demandFiltersPresent,
			supplyFiltersPresent,
			gameDepartments,
			supplyMetric,
			setDemandFiltersPresent,
			setSupplyFiltersPresent,
			setGameDepartments,
			setSupplyMetric,
			showActiveFacilities,
			setShowActiveFacilities,
			showInactiveFacilities,
			setShowInactiveFacilities,
			showGamesTrend,
			setShowGamesTrend,
			sessionFilters,
			setSessionFilters,
			showSessions,
			setShowSessions,
			resetLayers,
		}),
		[
			demandMetric,
			demandFiltersPresent,
			supplyFiltersPresent,
			gameDepartments,
			supplyMetric,
			showActiveFacilities,
			showInactiveFacilities,
			showGamesTrend,
			showSessions,
			sessionFilters,
			resetLayers,
		],
	);
	return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
	return useContext(MapLayersContext);
}
