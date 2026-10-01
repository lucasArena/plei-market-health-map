import type { ReactNode } from "react";

export type LayersCardMotion = "resting" | "enter" | "exit";
export type DemandHeatmapMetric = "registrations" | "app-sessions";

export interface MapLayersValue {
	showFacilities: boolean;
	setShowFacilities: (showFacilities: boolean) => void;
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
