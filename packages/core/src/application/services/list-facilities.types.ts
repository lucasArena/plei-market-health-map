import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";

export interface ListFacilitiesDeps {
	facilities: FacilityRepository;
}
