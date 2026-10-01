"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
	DemandHeatmapMetric,
	MapLayersProviderProps,
	MapLayersValue,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

const MapLayersContext = createContext<MapLayersValue | null>(null);

export function MapLayersProvider({ children }: Readonly<MapLayersProviderProps>) {
	const [showActiveFacilities, setShowActiveFacilities] = useState(true);
	const [showInactiveFacilities, setShowInactiveFacilities] = useState(true);
	const [demandMetric, setDemandMetric] = useState<DemandHeatmapMetric>("app-sessions");
	const value = useMemo(
		() => ({
			showActiveFacilities,
			setShowActiveFacilities,
			showInactiveFacilities,
			setShowInactiveFacilities,
			demandMetric,
			setDemandMetric,
		}),
		[showActiveFacilities, showInactiveFacilities, demandMetric],
	);
	return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
	return useContext(MapLayersContext);
}
