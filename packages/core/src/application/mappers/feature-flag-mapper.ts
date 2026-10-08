import type {
	FeatureFlagRecord,
	FeatureFlagView,
} from "@core/application/dtos/feature-flags-dto.types";

export function toFeatureFlagView(
	key: string,
	record: FeatureFlagRecord | undefined,
	requires?: string,
): FeatureFlagView {
	return {
		key,
		enabled: record?.enabled ?? false,
		updatedBy: record?.updatedBy ?? null,
		updatedAt: record?.updatedAt.toISOString() ?? null,
		...(requires ? { requires } : {}),
	};
}

export function isFeatureFlagInEffect(
	key: string,
	records: Map<string, FeatureFlagRecord>,
	requirements: Readonly<Record<string, string>>,
	seen: ReadonlySet<string> = new Set(),
): boolean {
	if (seen.has(key) || records.get(key)?.enabled !== true) return false;
	const requires = requirements[key];
	return (
		requires === undefined ||
		isFeatureFlagInEffect(requires, records, requirements, new Set([...seen, key]))
	);
}

export function recordsByKey(records: FeatureFlagRecord[]): Map<string, FeatureFlagRecord> {
	return new Map(records.map((record) => [record.key, record]));
}
