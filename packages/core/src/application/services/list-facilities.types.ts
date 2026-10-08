import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";

export interface ListFacilitiesDeps {
	facilities: FacilityRepository;
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
