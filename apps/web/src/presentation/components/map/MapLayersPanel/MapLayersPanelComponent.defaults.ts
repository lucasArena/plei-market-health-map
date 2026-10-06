import type { MapLayersSettings } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";

export const MAP_LAYERS_DEFAULTS: Readonly<MapLayersSettings> = {
	showActiveFacilities: true,
	showInactiveFacilities: false,
	showSessions: true,
	sessionFilters: {},
};

export function isMapLayersCustomized(settings: Readonly<MapLayersSettings>) {
	const hasSessionFilters = Object.values(settings.sessionFilters).some(
		(value) => value !== undefined,
	);
	return (
		settings.showActiveFacilities !== MAP_LAYERS_DEFAULTS.showActiveFacilities ||
		settings.showInactiveFacilities !== MAP_LAYERS_DEFAULTS.showInactiveFacilities ||
		settings.showSessions !== MAP_LAYERS_DEFAULTS.showSessions ||
		hasSessionFilters
	);
}
