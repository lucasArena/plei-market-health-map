import type { Facility } from "@core/domain";

export interface FacilityRepository {
	listAll(today: string): Promise<Facility[]>;
}
