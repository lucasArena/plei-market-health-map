import type { FacilityPointView } from "@market-health-map/core/application";
import type { Feature, FeatureCollection, Point } from "geojson";

export interface HoverPlacement {
	x: number;
	y: number;
	flipX: boolean;
	flipY: boolean;
}

export interface FacilityHover extends HoverPlacement {
	kind: "facility";
	facility: FacilityPointView;
}

export interface ClusterHover extends HoverPlacement {
	kind: "cluster";
	clusterId: number;
	total: number;
	facilities: FacilityPointView[];
}

export type MapHover = FacilityHover | ClusterHover;

export type FacilitiesMapStatus = "loading" | "error" | "ready";

export type FacilityLayerMotion = "enter" | "exit";

export interface FacilityFeatureProperties {
	id: string;
	marketId: string;
	marketName: string;
	name: string;
	isActive: boolean;
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
}

export interface FacilityGlassBadge {
	id: string;
	x: number;
	y: number;
	active: boolean;
}
