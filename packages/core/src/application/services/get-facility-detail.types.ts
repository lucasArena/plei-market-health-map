import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetFacilityDetailDeps {
	/** Reads now, so today is resolved in the viewer's time zone on each call. */
	clock: Clock;
	facilities: FacilityRepository;
	stats: FacilityStatsRepository;
}
