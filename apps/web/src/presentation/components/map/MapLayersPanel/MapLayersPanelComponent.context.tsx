"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
	DemandHeatmapMetric,
	MapLayersProviderProps,
	MapLayersValue,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

const MapLayersContext = createContext<MapLayersValue | null>(null);

export function MapLayersProvider({ children }: Readonly<MapLayersProviderProps>) {
	const [showFacilities, setShowFacilities] = useState(true);
	const [demandMetric, setDemandMetric] = useState<DemandHeatmapMetric>("app-sessions");
	const value = useMemo(
		() => ({ showFacilities, setShowFacilities, demandMetric, setDemandMetric }),
		[showFacilities, demandMetric],
	);
	return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
	return useContext(MapLayersContext);
}
