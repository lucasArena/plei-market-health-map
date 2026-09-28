import type { EntityId } from "@domain/shared/id.types";

export interface FacilityMetrics {
	activePlayers: number;
	gamesLastWeek: number;
	utilization: number;
}

export interface FacilityProps {
	id: EntityId;
	marketId: EntityId;
	name: string;
	address: string;
	avatarUrl: string | null;
	metrics: FacilityMetrics;
}
