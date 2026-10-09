import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityQualityRepository } from "@core/application/repositories/facility-quality-repository.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";

export interface GetFacilityQualityDeps {
	clock: Clock;
	facilities: FacilityRepository;
	quality: FacilityQualityRepository;
}
