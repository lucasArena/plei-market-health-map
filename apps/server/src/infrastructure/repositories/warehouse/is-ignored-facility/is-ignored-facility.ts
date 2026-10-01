const IGNORED_NAME_PATTERN = /\bignore\b/i;

/**
 * Ops marks facilities to hide by putting the word "ignore" in the name ("IGNORE - Test Gym",
 * "test ignore", "[Ignore] X"). It matches the whole word in any case, so names that only embed
 * the letters, such as "Signore Fitness", "Ignored" or "Pignoretti", stay visible.
 */
export function isIgnoredFacility(name: string | null): boolean {
	return IGNORED_NAME_PATTERN.test(name ?? "");
}
