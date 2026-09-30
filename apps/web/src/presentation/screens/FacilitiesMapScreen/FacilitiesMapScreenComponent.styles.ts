import type {
	CircleLayerSpecification,
	ExpressionSpecification,
	FilterSpecification,
	HeatmapLayerSpecification,
	SymbolLayerSpecification,
} from "maplibre-gl";
import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";
import { PLEI_LOGO_IMAGE_ID, PLEI_LOGO_MUTED_IMAGE_ID } from "@/application/constants/plei-logo";
import type { SessionHeatmapStudy } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

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

export const FACILITY_GLASS_DIAMETER = 29;
export const FACILITY_GLASS_CORE_SIZE = 17;
export const CLUSTER_OUTER_DIAMETER = 41;
export const CLUSTER_BORDER_WIDTH = 1;
export const CLUSTER_CIRCLE_RADIUS = (CLUSTER_OUTER_DIAMETER - CLUSTER_BORDER_WIDTH * 2) / 2;
export const CLUSTER_BORDER_COLOR = PLEIFUL_COLORS.success[30];
export const CLUSTER_GLASS_BLUR = 18;
export const CLUSTER_GLASS_SATURATE = 1.8;
export const CLUSTER_GLASS_FILL = "rgba(255, 255, 255, 0.28)";
export const FACILITY_GLASS_FILL = "rgba(255, 255, 255, 0.336)";
export const CLUSTER_GLASS_HIGHLIGHT =
	"linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0.22) 100%)";
export const CLUSTER_GLASS_BORDER = "rgba(255, 255, 255, 0.78)";
export const CLUSTER_GLASS_STROKE = 2;
export const CLUSTER_GLASS_STROKE_INSET = 3;
export const CLUSTER_GLASS_SHADOW =
	"inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 24px rgba(0,0,0,0.12)";
export const CLUSTER_GLASS_LABEL = PLEIFUL_COLORS.neutral[90];
export const CLUSTER_GLASS_INACTIVE_STROKE = "#898E99";
export const CLUSTER_GLASS_INACTIVE_LABEL = PLEIFUL_COLORS.neutral[70];
export const CLUSTER_ACTIVE_COUNT_KEY = "activeCount";
export const CLUSTER_ACTIVE_COUNT_EXPRESSION: ExpressionSpecification = [
	"+",
	["case", ["==", ["get", "isActive"], true], 1, 0],
];
export const FACILITY_GLASS_STROKE = 2;
export const FACILITY_GLASS_SHADOW = `inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 ${FACILITY_GLASS_STROKE}px ${CLUSTER_BORDER_COLOR}, 0 10px 24px rgba(0,0,0,0.12)`;
export const FACILITY_GLASS_INACTIVE_SHADOW = `inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 ${FACILITY_GLASS_STROKE}px ${PLEIFUL_COLORS.neutral[50]}, 0 10px 24px rgba(0,0,0,0.12)`;
export const FACILITY_GLASS_SELECTED_SHADOW = `inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 ${FACILITY_GLASS_STROKE + 1}px ${SELECTED_RING_COLOR}, 0 10px 24px rgba(0,0,0,0.12)`;
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
	"circle-opacity": 0,
	"circle-radius": FACILITY_GLASS_DIAMETER / 2,
	"circle-stroke-color": MARKER_RING_COLOR,
	"circle-stroke-opacity": 0,
	"circle-stroke-width": 0,
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

export const FACILITY_LOGO_PAINT: SymbolLayerSpecification["paint"] = {
	"icon-opacity": 0,
};

export const CLUSTER_PAINT: CircleLayerSpecification["paint"] = {
	"circle-color": PLEIFUL_COLORS.white,
	"circle-opacity": 0,
	"circle-radius": CLUSTER_CIRCLE_RADIUS,
	"circle-stroke-width": 0,
};

export const CLUSTER_COUNT_LAYOUT: SymbolLayerSpecification["layout"] = {
	"text-field": ["get", "point_count_abbreviated"],
	"text-font": ["Noto Sans Bold"],
	"text-size": 12,
	"text-allow-overlap": true,
};

export const CLUSTER_COUNT_PAINT: SymbolLayerSpecification["paint"] = {
	"text-color": PLEIFUL_COLORS.black,
	"text-opacity": 0,
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

export const SESSION_HEATMAP_PALETTE_COLORS = [
	PLEIFUL_COLORS.pitchGreen[50],
	PLEIFUL_COLORS.pitchGreen[70],
	PLEIFUL_COLORS.pitchGreen[90],
	PLEIFUL_COLORS.sangria[50],
] as const;

export const SESSION_HEATMAP_MARK_COLORS = [
	PLEIFUL_COLORS.pitchGreen[40],
	PLEIFUL_COLORS.pitchGreen[60],
	PLEIFUL_COLORS.sangria[40],
	PLEIFUL_COLORS.sangria[70],
] as const;

export const APP_SESSION_HEATMAP_PALETTE_PAINT: HeatmapLayerSpecification["paint"] = {
	"heatmap-weight": ["get", "intensity"],
	"heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.7, 8, 0.85, 14, 1],
	"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 14, 8, 24, 12, 32, 16, 44],
	"heatmap-opacity": 0.88,
	"heatmap-color": [
		"interpolate",
		["linear"],
		["heatmap-density"],
		0,
		"rgba(22, 117, 92, 0)",
		0.08,
		SESSION_HEATMAP_PALETTE_COLORS[0],
		0.35,
		SESSION_HEATMAP_PALETTE_COLORS[1],
		0.68,
		SESSION_HEATMAP_PALETTE_COLORS[2],
		1,
		SESSION_HEATMAP_PALETTE_COLORS[3],
	],
};

export const APP_SESSION_MARKS_PAINT: CircleLayerSpecification["paint"] = {
	"circle-radius": [
		"interpolate",
		["linear"],
		["zoom"],
		3,
		["interpolate", ["linear"], ["get", "intensity"], 0, 3, 1, 10],
		8,
		["interpolate", ["linear"], ["get", "intensity"], 0, 5, 1, 18],
		12,
		["interpolate", ["linear"], ["get", "intensity"], 0, 7, 1, 26],
	],
	"circle-color": [
		"interpolate",
		["linear"],
		["get", "intensity"],
		0,
		SESSION_HEATMAP_MARK_COLORS[0],
		0.35,
		SESSION_HEATMAP_MARK_COLORS[1],
		0.7,
		SESSION_HEATMAP_MARK_COLORS[2],
		1,
		SESSION_HEATMAP_MARK_COLORS[3],
	],
	"circle-opacity": 0.9,
	"circle-stroke-width": 1.25,
	"circle-stroke-color": PLEIFUL_COLORS.pitchGreen[90],
};

export function sessionHeatmapStudy(value: string | null): SessionHeatmapStudy {
	if (value === "palette") return "palette";
	if (value === "marks") return "marks";
	return "wash";
}

export function sessionHeatmapBucketColors(study: SessionHeatmapStudy): readonly string[] {
	if (study === "palette") return SESSION_HEATMAP_PALETTE_COLORS;
	if (study === "marks") return SESSION_HEATMAP_MARK_COLORS;
	return SESSION_HEATMAP_BUCKET_COLORS;
}

export function sessionHeatmapLayer(
	study: SessionHeatmapStudy,
): HeatmapLayerSpecification | CircleLayerSpecification {
	if (study === "marks") {
		return {
			id: APP_SESSION_HEATMAP_LAYER_ID,
			type: "circle",
			source: APP_SESSION_HEATMAP_SOURCE_ID,
			paint: APP_SESSION_MARKS_PAINT,
		};
	}
	const paint = study === "palette" ? APP_SESSION_HEATMAP_PALETTE_PAINT : APP_SESSION_HEATMAP_PAINT;
	return {
		id: APP_SESSION_HEATMAP_LAYER_ID,
		type: "heatmap",
		source: APP_SESSION_HEATMAP_SOURCE_ID,
		paint,
	};
}

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
