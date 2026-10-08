import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetFacilityDetailDeps {
	clock: Clock;
	facilities: FacilityRepository;
	stats: FacilityStatsRepository;
}
