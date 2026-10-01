import type { ReactNode } from "react";

export interface MapLayersValue {
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
