import type { GeoPoint } from "@core/domain/shared/geo-point.types";
import type { EntityId } from "@core/domain/shared/id.types";

export type GameDepartment = "magic" | "organizers" | "partnerships";

export type GameDepartmentCounts = Record<GameDepartment, number>;

export interface FacilityMetrics {
	gamesByDepartment?: GameDepartmentCounts;
	activePlayers: number;
	/** Games in the 7 full days ending yesterday (the viewer's local day). */
	gamesLastWeek: number;
	/** Games in the 28 full days ending yesterday (the viewer's local day). */
	gamesLast28Days: number;
	/** Games in the equal length window just before the last 28 days. */
	gamesPrevious28Days?: number;
	gamesPreviousByDepartment?: GameDepartmentCounts;
	gamesLastWeekByDepartment?: GameDepartmentCounts;
	/** Games in the 7 days just before the last 7 days. */
	gamesPreviousWeek?: number;
	gamesPreviousWeekByDepartment?: GameDepartmentCounts;
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
