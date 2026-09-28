import type { FacilityPointView } from "@market-health-map/application";
import type { Feature, FeatureCollection, Point } from "geojson";

export interface HoveredFacility {
	facility: FacilityPointView;
	x: number;
	y: number;
}

export type FacilitiesMapStatus = "loading" | "error" | "ready";

export interface FacilityFeatureProperties {
	id: string;
	marketId: string;
	name: string;
}

export type FacilityFeature = Feature<Point, FacilityFeatureProperties>;

export type FacilityFeatureCollection = FeatureCollection<Point, FacilityFeatureProperties>;
