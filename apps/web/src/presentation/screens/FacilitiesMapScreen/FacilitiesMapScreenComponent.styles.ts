import type {
	CircleLayerSpecification,
	ExpressionSpecification,
	FilterSpecification,
	HeatmapLayerSpecification,
	SymbolLayerSpecification,
} from "maplibre-gl";
import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";
import { PLEI_LOGO_IMAGE_ID, PLEI_LOGO_MUTED_IMAGE_ID } from "@/application/constants/plei-logo";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
export const MAPLIBRE_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";
export const MAP_CENTER: [number, number] = [-96.5, 38.5];
export const MAP_ZOOM = 3.4;
export const FACILITIES_SOURCE_ID = "facilities";
export const FACILITIES_LAYER_ID = "facilities-dots";
export const FACILITIES_LOGO_LAYER_ID = "facilities-logos";
export const MARKER_RING_COLOR = "#d1d5db";
export const SELECTED_RING_COLOR = "#111827";
export const DETAIL_PANEL_OFFSET = 384;
export const CLUSTER_LAYER_ID = "facilities-clusters";
export const CLUSTER_COUNT_LAYER_ID = "facilities-cluster-count";
export const CLUSTER_RADIUS = 40;
export const CLUSTER_MAX_ZOOM = 11;
export const CLUSTER_PREVIEW_LIMIT = 8;

export const APP_SESSION_HEATMAP_SOURCE_ID = "app-session-heatmap";
export const APP_SESSION_HEATMAP_LAYER_ID = "app-session-density";

export const CLUSTER_FILTER: FilterSpecification = ["has", "point_count"];
export const UNCLUSTERED_FILTER: FilterSpecification = ["!", ["has", "point_count"]];
export const FACILITY_COLOR = PLEIFUL_COLORS.pitchGreen[80];
export const TOOLTIP_OFFSET = 14;
export const HOVER_CARD_WIDTH = 256;

export const ACTIVE_ON_TOP_SORT_KEY: ExpressionSpecification = [
	"case",
	["==", ["get", "isActive"], true],
	1,
	0,
];

export const FACILITY_DOT_LAYOUT: CircleLayerSpecification["layout"] = {
	"circle-sort-key": ACTIVE_ON_TOP_SORT_KEY,
};

export const FACILITY_DOT_PAINT: CircleLayerSpecification["paint"] = {
	"circle-color": "#ffffff",
	"circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 8.5, 8, 12.5, 12, 15.5],
	"circle-stroke-color": MARKER_RING_COLOR,
	"circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 8, 1.5],
};

export const FACILITY_LOGO_LAYOUT: SymbolLayerSpecification["layout"] = {
	"icon-image": [
		"case",
		["==", ["get", "isActive"], true],
		PLEI_LOGO_IMAGE_ID,
		PLEI_LOGO_MUTED_IMAGE_ID,
	],
	"symbol-sort-key": ACTIVE_ON_TOP_SORT_KEY,
	"icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.35, 8, 0.55, 12, 0.7],
	"icon-allow-overlap": true,
	"icon-ignore-placement": true,
};

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

export const SESSION_HEATMAP_BUCKET_COLORS = [
	PLEIFUL_COLORS.sky[10],
	PLEIFUL_COLORS.sky[30],
	PLEIFUL_COLORS.sky[50],
	PLEIFUL_COLORS.moonlight[60],
] as const;

export const SESSION_HEATMAP_COLOR = SESSION_HEATMAP_BUCKET_COLORS[0];
export const SESSION_HEATMAP_BUCKET_OPACITIES = [0.35, 0.55, 0.75, 0.92] as const;

export const APP_SESSION_HEATMAP_PAINT: HeatmapLayerSpecification["paint"] = {
	"heatmap-weight": ["get", "intensity"],
	"heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.58, 8, 0.55, 14, 0.6],
	"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 12, 8, 20, 12, 28, 16, 40],
	"heatmap-opacity": 0.76,
	"heatmap-color": [
		"interpolate",
		["linear"],
		["heatmap-density"],
		0,
		"rgba(224, 242, 254, 0)",
		0.25,
		SESSION_HEATMAP_BUCKET_COLORS[0],
		0.55,
		SESSION_HEATMAP_BUCKET_COLORS[1],
		0.82,
		SESSION_HEATMAP_BUCKET_COLORS[2],
		0.98,
		SESSION_HEATMAP_BUCKET_COLORS[3],
		1,
		SESSION_HEATMAP_BUCKET_COLORS[3],
	],
};

export function selectedRingColor(facilityId: string | null): ExpressionSpecification {
	return ["case", ["==", ["get", "id"], facilityId ?? ""], SELECTED_RING_COLOR, MARKER_RING_COLOR];
}

export function selectedRingWidth(facilityId: string | null): ExpressionSpecification {
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
