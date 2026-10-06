import type { GeoPoint } from "@core/domain";

export interface FacilityPointView {
	id: string;
	marketId: string;
	marketName: string;
	name: string;
	avatarUrl: string | null;
	isActive: boolean;
	gamesLast28Days?: number;
	location: GeoPoint;
}
