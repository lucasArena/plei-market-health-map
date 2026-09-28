import type { GeoPoint, MarketHealthStatus, MarketMetrics } from "@market-health-map/domain";

export interface MarketHealthView {
	id: string;
	name: string;
	state: string;
	country: string;
	currency: string;
	location: GeoPoint;
	metrics: MarketMetrics;
	healthStatus: MarketHealthStatus;
}
