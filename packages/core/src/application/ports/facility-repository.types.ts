import type { Facility } from "@core/domain";

export interface FacilityRepository {
	listAll(): Promise<Facility[]>;
}
