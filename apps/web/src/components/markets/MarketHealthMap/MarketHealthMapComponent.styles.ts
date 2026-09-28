import type {
	CircleLayerSpecification,
	ExpressionSpecification,
	HeatmapLayerSpecification,
} from "maplibre-gl";
import { HEALTH_STATUS_COLORS } from "@/components/markets/market-health-colors";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
export const MAP_CENTER: [number, number] = [-96.5, 38.5];
export const MAP_ZOOM = 3.4;
export const DETAIL_PANEL_WIDTH = 400;
export const SELECTED_STROKE_COLOR = "#111827";
export const MARKETS_SOURCE_ID = "markets";
export const HEATMAP_LAYER_ID = "markets-heat";
export const CIRCLE_LAYER_ID = "markets-circles";

const statusColorExpression: ExpressionSpecification = [
	"match",
	["get", "healthStatus"],
	"healthy",
	HEALTH_STATUS_COLORS.healthy,
	"watch",
	HEALTH_STATUS_COLORS.watch,
	"inactive",
	HEALTH_STATUS_COLORS.inactive,
	HEALTH_STATUS_COLORS["at-risk"],
];

export const HEATMAP_PAINT: HeatmapLayerSpecification["paint"] = {
	"heatmap-weight": ["get", "weight"],
	"heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1.4, 9, 3],
	"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 32, 6, 70, 9, 130],
	"heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.9, 10, 0.6],
	"heatmap-color": [
		"interpolate",
		["linear"],
		["heatmap-density"],
		0,
		"rgba(4, 120, 87, 0)",
		0.15,
		"#a7f3d0",
		0.4,
		"#fde68a",
		0.6,
		"#fbbf24",
		0.8,
		"#f97316",
		1,
		"#dc2626",
	],
};

export const CIRCLE_PAINT: CircleLayerSpecification["paint"] = {
	"circle-color": statusColorExpression,
	"circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 8, 11],
	"circle-stroke-color": "#ffffff",
	"circle-stroke-width": 1.5,
};

export function selectedStrokeColor(marketId: string | null): ExpressionSpecification {
	return ["case", ["==", ["get", "id"], marketId ?? ""], SELECTED_STROKE_COLOR, "#ffffff"];
}

export function selectedStrokeWidth(marketId: string | null): ExpressionSpecification {
	return ["case", ["==", ["get", "id"], marketId ?? ""], 4, 1.5];
}
