const TEST_NAME_PATTERN = /\b(qa|test|dummy|fake)\b/i;
const INTERNAL_REGION_PATTERN = /automation|pipeline|\btest\b|lucas|l2m|m2m/i;

export function isTestFacility(name: string | null, regionName: string | null): boolean {
	return TEST_NAME_PATTERN.test(name ?? "") || INTERNAL_REGION_PATTERN.test(regionName ?? "");
}
