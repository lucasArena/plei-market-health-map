import type { FacilityRepository } from "@core/application/ports/facility-repository.types";
import type { FacilityReservationStatsRepository } from "@core/application/ports/facility-stats-repository.types";

export interface GetFacilityReservationStatsDeps {
	facilities: FacilityRepository;
	stats: FacilityReservationStatsRepository;
}
