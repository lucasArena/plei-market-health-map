import {
	FEATURE_FLAG_KEYS,
	FEATURE_FLAG_REQUIREMENTS,
} from "@core/application/dtos/feature-flags-dto";
import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import { isFeatureFlagInEffect, recordsByKey } from "@core/application/mappers/feature-flag-mapper";
import type { FeatureFlagsDeps } from "@core/application/services/feature-flags.types";

export function makeListEnabledFeatureFlags({
	featureFlags,
	keys = FEATURE_FLAG_KEYS,
	requirements = FEATURE_FLAG_REQUIREMENTS,
}: FeatureFlagsDeps) {
	return async function listEnabledFeatureFlags(): Promise<EnabledFeatureFlagsView> {
		const records = recordsByKey(await featureFlags.listAll());
		return {
			enabled: keys.filter((key) => isFeatureFlagInEffect(key, records, requirements)),
		};
	};
}
