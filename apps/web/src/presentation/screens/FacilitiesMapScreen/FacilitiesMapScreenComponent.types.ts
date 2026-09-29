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

export interface FacilityFeatureProperties {
	id: string;
	marketId: string;
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
