import type { FacilityPointView } from "@market-health-map/application";
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
}

export type FacilityFeature = Feature<Point, FacilityFeatureProperties>;

export type FacilityFeatureCollection = FeatureCollection<Point, FacilityFeatureProperties>;
