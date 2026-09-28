import type { GeoPoint } from "@market-health-map/domain";

export interface FacilityPointView {
	id: string;
	marketId: string;
	name: string;
	avatarUrl: string | null;
	location: GeoPoint;
}
