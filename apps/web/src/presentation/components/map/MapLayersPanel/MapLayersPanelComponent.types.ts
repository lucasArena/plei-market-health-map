import type { ReactNode } from "react";

export interface MapLayersValue {
	showFacilities: boolean;
	setShowFacilities: (showFacilities: boolean) => void;
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
