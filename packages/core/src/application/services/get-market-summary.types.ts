import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityReservationStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetMarketSummaryDeps {
	clock: Clock;
	facilities: FacilityRepository;
	stats: FacilityReservationStatsRepository;
}
