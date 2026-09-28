import type { FacilityRepository } from "@application/ports/facility-repository.types";

export interface ListFacilitiesDeps {
	facilities: FacilityRepository;
}
