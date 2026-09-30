import type { FacilityRepository } from "@core/application/ports/facility-repository.types";
import type { FacilityPlayerStatsRepository } from "@core/application/ports/facility-stats-repository.types";

export interface GetFacilityPlayerStatsDeps {
	facilities: FacilityRepository;
	stats: FacilityPlayerStatsRepository;
}
