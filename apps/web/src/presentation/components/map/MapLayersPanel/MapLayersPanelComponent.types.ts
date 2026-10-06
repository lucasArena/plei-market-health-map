import type { AppSessionFilters } from "@market-health-map/core/application";
import type { ReactNode } from "react";

export interface MapLayersSettings {
	showActiveFacilities: boolean;
	showInactiveFacilities: boolean;
	showSessions: boolean;
	sessionFilters: AppSessionFilters;
}

export interface MapLayersValue {
	demandMetric?: "sessions" | "registrations";
	setDemandMetric?: (metric: "sessions" | "registrations") => void;
	supplyMetric?: "facilities" | "games";
	setSupplyMetric?: (metric: "facilities" | "games") => void;
	sessionFilters: AppSessionFilters;
	setSessionFilters: (filters: AppSessionFilters) => void;
	showActiveFacilities: boolean;
	setShowActiveFacilities: (showActiveFacilities: boolean) => void;
	showInactiveFacilities: boolean;
	setShowInactiveFacilities: (showInactiveFacilities: boolean) => void;
	showSessions: boolean;
	setShowSessions: (showSessions: boolean) => void;
	resetLayers: () => void;
}

export interface MapLayersProviderProps {
	children: ReactNode;
}

export interface LayerSwitchProps {
	checked: boolean;
	label: string;
	onToggle: () => void;
}
