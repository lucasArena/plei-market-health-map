"use client";

import type { AppSessionFilters } from "@market-health-map/core/application";
import { createContext, useContext, useMemo, useState } from "react";
import type {
	MapLayersProviderProps,
	MapLayersValue,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

const MapLayersContext = createContext<MapLayersValue | null>(null);

export function MapLayersProvider({ children }: Readonly<MapLayersProviderProps>) {
	const [showActiveFacilities, setShowActiveFacilities] = useState(true);
	const [showInactiveFacilities, setShowInactiveFacilities] = useState(true);
	const [showSessions, setShowSessions] = useState(true);
	const [sessionFilters, setSessionFilters] = useState<AppSessionFilters>({});
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
		}),
		[showActiveFacilities, showInactiveFacilities, showSessions, sessionFilters],
	);
	return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
	return useContext(MapLayersContext);
}
