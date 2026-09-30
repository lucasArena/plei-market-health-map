import type { ReactNode } from "react";

export type UserLayerFilter = "all" | "active-users" | "active-players";

export type LayersCardMotion = "resting" | "enter" | "exit";

export interface MapLayersValue {
	showFacilities: boolean;
	setShowFacilities: (showFacilities: boolean) => void;
}

export interface MapLayersProviderProps {
	children: ReactNode;
}

export interface LayerSwitchProps {
	checked: boolean;
	label: string;
	onToggle: () => void;
}

export interface UserFilterOption {
	id: UserLayerFilter;
	label: string;
}

export interface UserFilterButtonProps {
	option: UserFilterOption;
	selected: boolean;
	onSelect: (id: UserLayerFilter) => void;
}
