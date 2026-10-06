import type { GeoPoint } from "@core/domain/shared/geo-point.types";
import type { EntityId } from "@core/domain/shared/id.types";

export type GameDepartment = "magic" | "organizers" | "partnerships";

export type GameDepartmentCounts = Record<GameDepartment, number>;

export interface FacilityMetrics {
	gamesByDepartment?: GameDepartmentCounts;
	activePlayers: number;
	gamesLastWeek: number;
	gamesLast28Days: number;
	/** Games in the equal length window just before the last 28 days. */
	gamesPrevious28Days?: number;
	gamesPreviousByDepartment?: GameDepartmentCounts;
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
