import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityReservationStatsRepository } from "@core/application/repositories/facility-stats-repository.types";

export interface GetMarketSummaryDeps {
	facilities: FacilityRepository;
	stats: FacilityReservationStatsRepository;
}
