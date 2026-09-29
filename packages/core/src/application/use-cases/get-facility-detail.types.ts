import type { FacilityRepository } from "@core/application/ports/facility-repository.types";
import type { FacilityStatsRepository } from "@core/application/ports/facility-stats-repository.types";

export interface GetFacilityDetailDeps {
	facilities: FacilityRepository;
	stats: FacilityStatsRepository;
}
