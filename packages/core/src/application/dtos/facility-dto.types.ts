import type { GameDepartmentCounts, GeoPoint } from "@core/domain";

export interface FacilityPointView {
	id: string;
	marketId: string;
	marketName: string;
	name: string;
	avatarUrl: string | null;
	isActive: boolean;
	gamesLast28Days?: number;
	gamesByDepartment?: GameDepartmentCounts;
	gamesPrevious28Days?: number;
	gamesPreviousByDepartment?: GameDepartmentCounts;
	isActiveLastWeek: boolean;
	location: GeoPoint;
}
