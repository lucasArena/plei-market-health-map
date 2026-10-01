const IGNORED_NAME_PATTERN = /\bignore\b/i;

export function isIgnoredFacility(name: string | null): boolean {
	return IGNORED_NAME_PATTERN.test(name ?? "");
}
