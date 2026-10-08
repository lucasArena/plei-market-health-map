import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";

export interface ListFacilitiesDeps {
	clock: Clock;
	facilities: FacilityRepository;
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
