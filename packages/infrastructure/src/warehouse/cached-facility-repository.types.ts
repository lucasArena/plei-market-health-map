import type { Facility } from "@market-health-map/domain";

export interface CachedFacilities {
	expiresAt: number;
	value: Promise<Facility[]>;
}
