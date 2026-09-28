import type { MarketHealthView } from "@market-health-map/application";
import type { MarketHealthStatus, MarketMetrics } from "@market-health-map/domain";
import type { Feature, FeatureCollection, Point } from "geojson";

export type MarketMetricKey = keyof MarketMetrics;

export type MarketMapStatus = "loading" | "error" | "ready";

export interface MarketFeatureProperties {
	id: string;
	name: string;
	state: string;
	healthStatus: MarketHealthStatus;
	healthScore: number;
	activePlayers: number;
	gamesLastWeek: number;
	facilities: number;
	weight: number;
}

export type MarketFeature = Feature<Point, MarketFeatureProperties>;

export type MarketFeatureCollection = FeatureCollection<Point, MarketFeatureProperties>;

export interface MarketMetricOption {
	key: MarketMetricKey;
	label: string;
}

export interface MarketLegendItem {
	status: MarketHealthStatus;
	label: string;
	color: string;
}

export type MarketsInput = MarketHealthView[] | undefined;
