import type { FacilityRepository } from "@core/application/ports/facility-repository.types";
import type { FacilityGameComparisonRepository } from "@core/application/ports/facility-stats-repository.types";
export interface GetMarketGameInsightsDeps {
	facilities: FacilityRepository;
	stats: FacilityGameComparisonRepository;
}
