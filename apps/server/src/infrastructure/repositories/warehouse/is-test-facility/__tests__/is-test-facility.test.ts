import { isTestFacility } from "@server/infrastructure/repositories/warehouse/is-test-facility/is-test-facility";

describe("isTestFacility", () => {
	it.each([
		["QA Aurora Creek Sports Centre", "Alaska"],
		["Kodiak Harbor Sports Dome QA", "Alaska"],
		["adidas TEST", "South Florida"],
		["Soccer Field", "L2M Region"],
		["Soccer Field", "Automation US Region"],
		["Soccer Field", "TEST - Austin"],
	])("flags %s in %s", (name, region) => {
		expect(isTestFacility(name, region)).toBe(true);
	});

	it.each([
		["The Sports Yard | Section 109", "St. Louis"],
		["Aquatics Center", "Houston"],
		["Contest Park", "Dallas | Fort Worth"],
		[null, null],
	])("keeps %s in %s", (name, region) => {
		expect(isTestFacility(name, region)).toBe(false);
	});
});
