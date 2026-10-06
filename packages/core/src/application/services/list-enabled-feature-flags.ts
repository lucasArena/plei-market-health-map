import { FEATURE_FLAG_KEYS } from "@core/application/dtos/feature-flags-dto";
import type { EnabledFeatureFlagsView } from "@core/application/dtos/feature-flags-dto.types";
import { recordsByKey } from "@core/application/mappers/feature-flag-mapper";
import type { FeatureFlagsDeps } from "@core/application/services/feature-flags.types";

export function makeListEnabledFeatureFlags({
	featureFlags,
	keys = FEATURE_FLAG_KEYS,
}: FeatureFlagsDeps) {
	return async function listEnabledFeatureFlags(): Promise<EnabledFeatureFlagsView> {
		const records = recordsByKey(await featureFlags.listAll());
		return { enabled: keys.filter((key) => records.get(key)?.enabled === true) };
	};
}
