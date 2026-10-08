import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityPlayerStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetFacilityPlayerStatsDeps {
	clock: Clock;
	facilities: FacilityRepository;
	stats: FacilityPlayerStatsRepository;
}
