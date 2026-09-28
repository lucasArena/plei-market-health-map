import type { MARKET_HEALTH_STATUSES } from "@domain/entities/market/market";
import type { GeoPoint } from "@domain/shared/geo-point.types";
import type { EntityId } from "@domain/shared/id.types";

export type MarketHealthStatus = (typeof MARKET_HEALTH_STATUSES)[number];

export type { GeoPoint } from "@domain/shared/geo-point.types";

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
