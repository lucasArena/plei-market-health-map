import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityPlayerStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetMarketPlayerStatsDeps {
	facilities: FacilityRepository;
	stats: FacilityPlayerStatsRepository;
}
