import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityPlayerStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetMarketPlayerStatsDeps {
	/** Reads now, so today is resolved in the viewer's time zone on each call. */
	clock: Clock;
	facilities: FacilityRepository;
	stats: FacilityPlayerStatsRepository;
}
