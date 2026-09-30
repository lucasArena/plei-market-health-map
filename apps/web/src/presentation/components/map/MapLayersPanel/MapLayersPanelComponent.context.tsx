"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
	MapLayersProviderProps,
	MapLayersValue,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

const MapLayersContext = createContext<MapLayersValue | null>(null);

export function MapLayersProvider({ children }: Readonly<MapLayersProviderProps>) {
	const [showFacilities, setShowFacilities] = useState(false);
	const value = useMemo(() => ({ showFacilities, setShowFacilities }), [showFacilities]);
	return <MapLayersContext.Provider value={value}>{children}</MapLayersContext.Provider>;
}

export function useMapLayers() {
	return useContext(MapLayersContext);
}
