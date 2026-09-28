import type { MARKET_HEALTH_STATUSES } from "@domain/entities/market/market";
import type { EntityId } from "@domain/shared/id.types";

export type MarketHealthStatus = (typeof MARKET_HEALTH_STATUSES)[number];

export interface GeoPoint {
	latitude: number;
	longitude: number;
}

export interface MarketMetrics {
	activePlayers: number;
	gamesLastWeek: number;
	facilities: number;
	healthScore: number;
}

export interface MarketProps {
	id: EntityId;
	name: string;
	state: string;
	country: string;
	currency: string;
	location: GeoPoint;
	metrics: MarketMetrics;
}
