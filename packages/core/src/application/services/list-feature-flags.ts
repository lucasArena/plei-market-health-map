import {
	FEATURE_FLAG_KEYS,
	FEATURE_FLAG_REQUIREMENTS,
} from "@core/application/dtos/feature-flags-dto";
import type { FeatureFlagView } from "@core/application/dtos/feature-flags-dto.types";
import { recordsByKey, toFeatureFlagView } from "@core/application/mappers/feature-flag-mapper";
import type { FeatureFlagsDeps } from "@core/application/services/feature-flags.types";

export function makeListFeatureFlags({
	featureFlags,
	keys = FEATURE_FLAG_KEYS,
	requirements = FEATURE_FLAG_REQUIREMENTS,
}: FeatureFlagsDeps) {
	return async function listFeatureFlags(): Promise<FeatureFlagView[]> {
		const records = recordsByKey(await featureFlags.listAll());
		return keys.map((key) => toFeatureFlagView(key, records.get(key), requirements[key]));
	};
}
