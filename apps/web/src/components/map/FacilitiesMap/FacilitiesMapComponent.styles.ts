import type {
	CircleLayerSpecification,
	ExpressionSpecification,
	FilterSpecification,
	SymbolLayerSpecification,
} from "maplibre-gl";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
export const MAPLIBRE_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
export const MAP_CENTER: [number, number] = [-96.5, 38.5];
export const MAP_ZOOM = 3.4;
export const FACILITIES_SOURCE_ID = "facilities";
export const FACILITIES_LAYER_ID = "facilities-dots";
export const CLUSTER_LAYER_ID = "facilities-clusters";
export const CLUSTER_COUNT_LAYER_ID = "facilities-cluster-count";
export const CLUSTER_RADIUS = 40;
export const CLUSTER_MAX_ZOOM = 11;
export const CLUSTER_PREVIEW_LIMIT = 8;

export const CLUSTER_FILTER: FilterSpecification = ["has", "point_count"];
export const UNCLUSTERED_FILTER: FilterSpecification = ["!", ["has", "point_count"]];
export const FACILITY_COLOR = "#047857";
export const SELECTED_STROKE_COLOR = "#111827";
export const PANEL_WIDTH = 360;
export const TOOLTIP_OFFSET = 14;
export const HOVER_CARD_WIDTH = 256;

export const FACILITY_DOT_PAINT: CircleLayerSpecification["paint"] = {
	"circle-color": FACILITY_COLOR,
	"circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 2.5, 8, 5, 12, 7],
	"circle-opacity": 0.85,
	"circle-stroke-color": "#ffffff",
	"circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 8, 1.5],
};

export function selectedStrokeColor(facilityId: string | null): ExpressionSpecification {
	return ["case", ["==", ["get", "id"], facilityId ?? ""], SELECTED_STROKE_COLOR, "#ffffff"];
}

export function selectedStrokeWidth(facilityId: string | null): ExpressionSpecification {
	const isSelected: ExpressionSpecification = ["==", ["get", "id"], facilityId ?? ""];
	return [
		"interpolate",
		["linear"],
		["zoom"],
		3,
		["case", isSelected, 2, 0.5],
		8,
		["case", isSelected, 3, 1.5],
	];
}

export const CLUSTER_PAINT: CircleLayerSpecification["paint"] = {
	"circle-color": FACILITY_COLOR,
	"circle-opacity": 0.9,
	"circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24],
	"circle-stroke-color": "#ffffff",
	"circle-stroke-width": 2,
};

export const CLUSTER_COUNT_LAYOUT: SymbolLayerSpecification["layout"] = {
	"text-field": ["get", "point_count_abbreviated"],
	"text-font": ["Noto Sans Bold"],
	"text-size": 12,
	"text-allow-overlap": true,
};

export const CLUSTER_COUNT_PAINT: SymbolLayerSpecification["paint"] = {
	"text-color": "#ffffff",
};
