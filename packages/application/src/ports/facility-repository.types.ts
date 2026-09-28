import type { Facility } from "@market-health-map/domain";

export interface FacilityRepository {
	listAll(): Promise<Facility[]>;
}
