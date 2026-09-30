import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetFacilityDetailDeps {
	facilities: FacilityRepository;
	stats: FacilityStatsRepository;
}
