import type { AppSessionFilters } from "@market-health-map/core/application";
import type { ReactNode } from "react";

export interface MapLayersValue {
	sessionFilters: AppSessionFilters;
	setSessionFilters: (filters: AppSessionFilters) => void;
	showActiveFacilities: boolean;
	setShowActiveFacilities: (showActiveFacilities: boolean) => void;
	showInactiveFacilities: boolean;
	setShowInactiveFacilities: (showInactiveFacilities: boolean) => void;
	showSessions: boolean;
	setShowSessions: (showSessions: boolean) => void;
}

export interface MapLayersProviderProps {
	children: ReactNode;
}

export interface LayerSwitchProps {
	checked: boolean;
	label: string;
	onToggle: () => void;
}
