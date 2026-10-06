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
export const MAP_CURSOR = {
	navigate: "default",
	dragging: "grabbing",
	interactive: "pointer",
} as const;
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
export const FACILITY_DOT_ZOOM = CLUSTER_MAX_ZOOM + 1;
export const CLUSTER_PREVIEW_LIMIT = 8;
export const CLUSTER_MARKER_CLASS = "cluster-marker";
export const CLUSTER_MARKER_HOVER_SCALE = 1.06;
export const CLUSTER_MARKER_MOTION_MS = 200;
export const CLUSTER_MARKER_MOTION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const CLUSTER_HOVER_GAP = 8;
export const CLUSTER_HOVER_DISMISS_MS = 100;

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

/**
 * Games layer marker with no games in the current window (it is only on the map while Show
 * trend is on, because it had games before). One style set on the existing glass disc: faded,
 * with a dashed ring, so it never reads as a stable trend, and no trend color or pointer.
 */
export interface InactiveGamesMarkerStyle {
	opacity: number;
	ringWidth: number;
	ringStyle: "solid" | "dashed";
	ringColor: string;
	label: string;
}

export const INACTIVE_GAMES_MARKER_STYLE: Readonly<InactiveGamesMarkerStyle> = {
	opacity: 0.6,
	ringWidth: 1.5,
	ringStyle: "dashed",
	ringColor: PLEIFUL_COLORS.neutral[50],
	label: PLEIFUL_COLORS.neutral[60],
};

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

export const SESSION_HEATMAP_LEGEND_CLASS = [
	"pointer-events-auto map-glass w-56 rounded-[var(--map-radius)]",
	"border border-border/60 px-3 py-2.5 shadow-[var(--map-shadow)]",
].join(" ");

export const SESSION_HEATMAP_BUCKET_COLORS = [
	PLEIFUL_COLORS.sky[30],
	"#0080FF",
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
		"rgba(125, 211, 252, 0)",
		0.25,
		SESSION_HEATMAP_BUCKET_COLORS[0],
		0.55,
		SESSION_HEATMAP_BUCKET_COLORS[1],
		0.82,
		SESSION_HEATMAP_BUCKET_COLORS[2],
		0.98,
		SESSION_HEATMAP_BUCKET_COLORS[2],
		1,
		SESSION_HEATMAP_BUCKET_COLORS[2],
	],
};

export const REGISTRATION_HEATMAP_PAINT: HeatmapLayerSpecification["paint"] = {
	...APP_SESSION_HEATMAP_PAINT,
	"heatmap-intensity": 3,
	"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 24, 8, 32, 12, 40, 16, 48],
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

export const CLUSTER_GAME_COUNT_KEY = "gameCount";
export const CLUSTER_PREVIOUS_GAME_COUNT_KEY = "gamePreviousCount";

/**
 * Cluster sums for the games layer and its trend. Both windows are summed, so a cluster's
 * trend comes from its totals, never from averaged percents.
 */
export const GAMES_CLUSTER_PROPERTIES: Record<string, ExpressionSpecification> = {
	[CLUSTER_GAME_COUNT_KEY]: ["+", ["get", "gamesLast28Days"]],
	[CLUSTER_PREVIOUS_GAME_COUNT_KEY]: ["+", ["get", "gamesPrevious28Days"]],
};

/**
 * Trend ring and pointer: a CSS pseudo element on the existing glass disc (no extra DOM, no
 * map layers) paints the ring and, for up and down, a tip bounded by the two tangents from the
 * apex to the ring's outer edge, so ring and tip read as one pin shape. The paint is a glass
 * gradient over the trend color; the hole keeps it off the count.
 */
export const TREND_TIP_CLASS = "games-trend-tip";
/** The tip apex sits this far past the glass disc edge. */
export const TREND_TIP_LENGTH = 5;

export interface TrendRing {
	/** Disc diameter the ring belongs to. */
	disc: number;
	outer: number;
	inner: number;
}

export const GAMES_TREND_DIAMETER = 45;

export const CLUSTER_TREND_RING: TrendRing = {
	disc: GAMES_TREND_DIAMETER,
	outer: GAMES_TREND_DIAMETER / 2 - CLUSTER_BORDER_WIDTH,
	inner: GAMES_TREND_DIAMETER / 2 - CLUSTER_BORDER_WIDTH - CLUSTER_GLASS_STROKE,
};
export const FACILITY_TREND_RING: TrendRing = { ...CLUSTER_TREND_RING };

function num(value: number) {
	return String(Math.round(value * 100) / 100);
}

function circlePath(center: number, radius: number) {
	const r = num(radius);
	return `M ${num(center + radius)} ${num(center)} A ${r} ${r} 0 1 0 ${num(center - radius)} ${num(center)} A ${r} ${r} 0 1 0 ${num(center + radius)} ${num(center)} Z`;
}

/**
 * Ring and tip as one even odd path in a square box centered on the disc: the outer edge runs
 * around the ring and out along the two tangents to the apex, and the inner circle is the hole,
 * so the glass paint covers ring and tip as a single shape with no seam.
 */
export function trendTipShape(ring: TrendRing) {
	const apex = ring.disc / 2 + TREND_TIP_LENGTH;
	const box = Math.ceil(apex + 1) * 2;
	const center = box / 2;
	const cos = ring.outer / apex;
	const sin = Math.sqrt(1 - cos * cos);
	const tangentX = ring.outer * sin;
	const tangentY = ring.outer * cos;
	const r = num(ring.outer);
	const hole = circlePath(center, ring.inner);
	const tip = (direction: 1 | -1, sweep: 0 | 1) =>
		`path(evenodd, "M ${num(center + tangentX)} ${num(center + direction * tangentY)} A ${r} ${r} 0 1 ${sweep} ${num(center - tangentX)} ${num(center + direction * tangentY)} L ${num(center)} ${num(center + direction * apex)} Z ${hole}")`;
	return {
		apex,
		box,
		inner: ring.inner,
		down: tip(1, 0),
		up: tip(-1, 1),
		stable: tip(1, 0),
	};
}

export type TrendTipShape = ReturnType<typeof trendTipShape>;

export const CLUSTER_TREND_TIP = trendTipShape(CLUSTER_TREND_RING);
export const FACILITY_TREND_TIP = trendTipShape(FACILITY_TREND_RING);

export function facilityGlassRingShadow(color: string, width = FACILITY_GLASS_STROKE) {
	return `inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 ${width}px ${color}, 0 10px 24px rgba(0,0,0,0.12)`;
}
