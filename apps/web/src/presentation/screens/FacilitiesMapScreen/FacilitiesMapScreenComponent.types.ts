import type { FacilityPointView } from "@market-health-map/core/application";
import type { GamesTrend, GamesTrendLevel } from "@market-health-map/core/domain";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { trendTipShape } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

export interface HoverPlacement {
	x: number;
	y: number;
	flipX: boolean;
	flipY: boolean;
}

export interface ClusterHoverViewport {
	width: number;
	height: number;
}

export interface FacilityTrendCounts {
	current: number;
	previous: number;
}

export interface FacilityHover extends HoverPlacement {
	kind: "facility";
	facility: FacilityPointView;
	viewport: ClusterHoverViewport;
	games?: number;
	trend?: GamesTrend;
}

export interface ClusterHover extends HoverPlacement {
	kind: "cluster";
	clusterId: number;
	total: number;
	facilities: FacilityPointView[];
	viewport: ClusterHoverViewport;
	games?: number;
	trend?: GamesTrend;
}

export type MapHover = FacilityHover | ClusterHover;

export type FacilitiesMapStatus = "loading" | "error" | "ready";

export type SessionLegendState = "loading" | "empty" | "scale";

export type FacilityLayerMotion = "enter" | "exit";

export interface FacilityFeatureProperties {
	id: string;
	marketId: string;
	marketName: string;
	name: string;
	isActive: boolean;
	gamesLast28Days?: number;
	gamesPrevious28Days?: number;
}

export type FacilityFeature = Feature<Point, FacilityFeatureProperties>;

export type FacilityFeatureCollection = FeatureCollection<Point, FacilityFeatureProperties>;

export interface AppSessionHeatmapFeatureProperties {
	sessionWeight: number;
	intensity: number;
}

export interface SessionHeatmapBounds {
	contains(coordinates: [number, number]): boolean;
	getEast?(): number;
	getNorth?(): number;
	getSouth?(): number;
	getWest?(): number;
}

export interface SessionHeatmapScale {
	low: number;
	high: number;
}

export interface SessionHeatmapArea {
	lat: number;
	lng: number;
	sessionWeight: number;
}

export type AppSessionHeatmapFeature = Feature<Point, AppSessionHeatmapFeatureProperties>;

export type AppSessionHeatmapFeatureCollection = FeatureCollection<
	Point,
	AppSessionHeatmapFeatureProperties
>;

export interface ClusterGlassFeature {
	geometry?: { coordinates?: readonly unknown[] };
	properties?: {
		cluster_id?: number;
		point_count?: number;
		point_count_abbreviated?: string | number;
		activeCount?: number;
		gameCount?: number;
		gamePreviousCount?: number;
		gamesLast28Days?: number;
		gamesPrevious28Days?: number;
		id?: string | number;
		isActive?: boolean | number | string;
	};
}

export interface ClusterTreeFeature {
	geometry?: unknown;
	properties?: {
		cluster?: boolean;
		cluster_id?: number;
		point_count?: number;
		id?: string | number;
		isActive?: boolean | number | string;
	} | null;
}

export interface ClusterTreeSource {
	getClusterExpansionZoom(clusterId: number): Promise<number>;
	getClusterChildren(clusterId: number): Promise<readonly ClusterTreeFeature[]>;
	getClusterLeaves(
		clusterId: number,
		limit: number,
		offset: number,
	): Promise<readonly ClusterTreeFeature[]>;
}

export interface ActiveClusterReveal {
	zoom: number;
	center: [number, number];
}

export interface ClusterGlassBadge {
	id: number;
	label: string;
	x: number;
	y: number;
	active: boolean;
	trend?: GamesTrendLevel;
	noGames?: boolean;
}

export interface FacilityGlassBadge {
	label?: string;
	id: string;
	x: number;
	y: number;
	active: boolean;
	trend?: GamesTrendLevel;
	noGames?: boolean;
}

export type SessionLegendFilterField = "gender" | "skill" | "age";

export interface SessionLegendFilterChip {
	field: SessionLegendFilterField;
	id: string;
	label: string;
}

export interface SessionLegendFiltersProps {
	chips: readonly SessionLegendFilterChip[];
	context: string;
	expandLabel: string;
	collapseLabel: string;
	removeLabel: string;
	canRemove: boolean;
	onRemove: (field: SessionLegendFilterField, id: string) => void;
}

export interface InactiveGamesMarkerStyle {
	opacity: number;
	ringWidth: number;
	ringStyle: "solid" | "dashed";
	ringColor: string;
	label: string;
}

export interface TrendRing {
	disc: number;
	outer: number;
	inner: number;
}

export type TrendTipShape = ReturnType<typeof trendTipShape>;
