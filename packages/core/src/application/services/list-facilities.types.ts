import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";

export interface ListFacilitiesDeps {
	/** Reads now, so today is resolved in the viewer's time zone on each call. */
	clock: Clock;
	facilities: FacilityRepository;
	/** The flags in effect; games and trend data are left out of the map list while theirs are off. */
	enabledFeatureFlags: () => Promise<EnabledFeatureFlagsView>;
}
