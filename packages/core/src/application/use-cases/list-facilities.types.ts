import type { FacilityRepository } from "@core/application/ports/facility-repository.types";

export interface ListFacilitiesDeps {
	facilities: FacilityRepository;
}
