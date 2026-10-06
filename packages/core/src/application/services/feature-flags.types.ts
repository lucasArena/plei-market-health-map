import type { Clock } from "@core/application/providers/clock.types";
import type { FeatureFlagRepository } from "@core/application/repositories/feature-flag-repository.types";

export interface FeatureFlagsDeps {
	featureFlags: FeatureFlagRepository;
	keys?: readonly string[];
	requirements?: Readonly<Record<string, string>>;
}

export interface SetFeatureFlagDeps extends FeatureFlagsDeps {
	clock: Clock;
}
