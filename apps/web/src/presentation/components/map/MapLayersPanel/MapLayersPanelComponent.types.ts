import type { ReactNode } from "react";

export type DemandHeatmapMetric = "registrations" | "app-sessions";

export interface MapLayersValue {
	showActiveFacilities: boolean;
	setShowActiveFacilities: (showActiveFacilities: boolean) => void;
	showInactiveFacilities: boolean;
	setShowInactiveFacilities: (showInactiveFacilities: boolean) => void;
	demandMetric: DemandHeatmapMetric;
	setDemandMetric: (demandMetric: DemandHeatmapMetric) => void;
}

export interface MapLayersProviderProps {
	children: ReactNode;
}

export interface LayerSwitchProps {
	checked: boolean;
	label: string;
	onToggle: () => void;
}
