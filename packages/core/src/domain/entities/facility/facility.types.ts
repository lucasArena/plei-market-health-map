import type { GeoPoint } from "@core/domain/shared/geo-point.types";
import type { EntityId } from "@core/domain/shared/id.types";

export interface FacilityMetrics {
	activePlayers: number;
	gamesLastWeek: number;
	gamesLast28Days: number;
	utilization: number;
}

export interface FacilityProps {
	id: EntityId;
	marketId: EntityId;
	marketName?: string;
	name: string;
	address: string;
	location: GeoPoint;
	avatarUrl: string | null;
	metrics: FacilityMetrics;
	memberIds?: EntityId[];
}
