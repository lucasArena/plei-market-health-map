import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { FacilityGameComparisonRepository } from "@core/application/repositories/facility-stats-repository.types";
export interface GetMarketGameInsightsDeps {
	facilities: FacilityRepository;
	stats: FacilityGameComparisonRepository;
}
