import { isIgnoredFacility } from "@server/infrastructure/repositories/warehouse/is-ignored-facility/is-ignored-facility";

describe("isIgnoredFacility", () => {
	it.each([
		"IGNORE - Test Gym",
		"test ignore",
		"[Ignore] X",
		"Phield House | IGNORE",
		"iGnOrE me",
		"Riverside Arena (ignore)",
		"ignore",
	])("hides %s", (name) => {
		expect(isIgnoredFacility(name)).toBe(true);
	});

	it.each([
		"Signore Fitness",
		"Ignored",
		"Pignoretti",
		"Ignite",
		"Downtown_IGNORE_Court",
		"The Sports Yard | Section 109",
		"",
		null,
	])("keeps %s", (name) => {
		expect(isIgnoredFacility(name)).toBe(false);
	});
});
