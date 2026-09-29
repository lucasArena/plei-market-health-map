import { isWithinServiceArea } from "@server/infrastructure/warehouse/service-area";

describe("isWithinServiceArea", () => {
	it.each([
		[29.75, -95.36],
		[61.22, -149.9],
		[-34.6, -58.38],
		[43.65, -79.38],
	])("keeps Plei markets at %s, %s", (latitude, longitude) => {
		expect(isWithinServiceArea(latitude, longitude)).toBe(true);
	});

	it.each([
		[-84.23, 156.34],
		[51.5, -0.12],
		[80, -100],
	])("rejects %s, %s", (latitude, longitude) => {
		expect(isWithinServiceArea(latitude, longitude)).toBe(false);
	});
});
