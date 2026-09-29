import type { GeoPoint } from "@core/domain";

export interface FacilityPointView {
	id: string;
	marketId: string;
	name: string;
	avatarUrl: string | null;
	location: GeoPoint;
}
