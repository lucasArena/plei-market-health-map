import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";

export interface ListFacilitiesDeps {
	facilities: FacilityRepository;
	/** The flags in effect; games and trend data are left out of the map list while theirs are off. */
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
