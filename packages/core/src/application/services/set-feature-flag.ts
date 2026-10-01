import { FEATURE_FLAG_KEYS, setFeatureFlagSchema } from "@core/application/dtos/feature-flags-dto";
import type {
	FeatureFlagView,
	SetFeatureFlagInput,
} from "@core/application/dtos/feature-flags-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { normalizeEmail } from "@core/application/mappers/app-metrics-mapper";
import { toFeatureFlagView } from "@core/application/mappers/feature-flag-mapper";
import type { SetFeatureFlagDeps } from "@core/application/services/feature-flags.types";

export function makeSetFeatureFlag({
	featureFlags,
	clock,
	keys = FEATURE_FLAG_KEYS,
}: SetFeatureFlagDeps) {
	return async function setFeatureFlag(input: SetFeatureFlagInput): Promise<FeatureFlagView> {
		const parsed = setFeatureFlagSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const { key, enabled, updatedBy } = parsed.data;
		if (!keys.includes(key)) throw new NotFoundError("Feature flag");
		const record = { key, enabled, updatedBy: normalizeEmail(updatedBy), updatedAt: clock.now() };
		await featureFlags.save(record);
		return toFeatureFlagView(key, record);
	};
}
