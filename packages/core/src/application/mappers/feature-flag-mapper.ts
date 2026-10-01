import type {
	FeatureFlagRecord,
	FeatureFlagView,
} from "@core/application/dtos/feature-flags-dto.types";

export function toFeatureFlagView(
	key: string,
	record: FeatureFlagRecord | undefined,
): FeatureFlagView {
	return {
		key,
		enabled: record?.enabled ?? false,
		updatedBy: record?.updatedBy ?? null,
		updatedAt: record?.updatedAt.toISOString() ?? null,
	};
}

export function recordsByKey(records: FeatureFlagRecord[]): Map<string, FeatureFlagRecord> {
	return new Map(records.map((record) => [record.key, record]));
}
