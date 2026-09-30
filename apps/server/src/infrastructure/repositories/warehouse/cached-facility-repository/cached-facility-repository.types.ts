import type { Facility } from "@market-health-map/core/domain";

export interface CachedFacilities {
	expiresAt: number;
	value: Promise<Facility[]>;
}
