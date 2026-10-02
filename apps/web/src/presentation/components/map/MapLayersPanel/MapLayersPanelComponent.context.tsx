"use client";

import type { AppSessionFilters } from "@market-health-map/core/application";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
	const [showSessions, setShowSessions] = useState(MAP_LAYERS_DEFAULTS.showSessions);
	const [sessionFilters, setSessionFilters] = useState<AppSessionFilters>({
		...MAP_LAYERS_DEFAULTS.sessionFilters,
	});
	const resetLayers = useCallback(() => {
		setShowActiveFacilities(MAP_LAYERS_DEFAULTS.showActiveFacilities);
		setShowInactiveFacilities(MAP_LAYERS_DEFAULTS.showInactiveFacilities);
		setShowSessions(MAP_LAYERS_DEFAULTS.showSessions);
		setSessionFilters({ ...MAP_LAYERS_DEFAULTS.sessionFilters });
	}, []);
	const value = useMemo(
		() => ({
			showActiveFacilities,
			setShowActiveFacilities,
			showInactiveFacilities,
			setShowInactiveFacilities,
			sessionFilters,
			setSessionFilters,
			showSessions,
			setShowSessions,
			resetLayers,
		}),
		[showActiveFacilities, showInactiveFacilities, showSessions, sessionFilters, resetLayers],
	);
	return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
	return useContext(MapLayersContext);
}
