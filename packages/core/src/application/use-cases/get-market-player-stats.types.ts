import type { FacilityRepository } from "@core/application/ports/facility-repository.types";
import type { FacilityPlayerStatsRepository } from "@core/application/ports/facility-stats-repository.types";

export interface GetMarketPlayerStatsDeps {
	facilities: FacilityRepository;
	stats: FacilityPlayerStatsRepository;
}
