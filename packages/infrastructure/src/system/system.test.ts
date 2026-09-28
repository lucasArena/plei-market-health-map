import { SystemClock } from "@infra/system/system-clock";
import { UuidGenerator } from "@infra/system/uuid-generator";

describe("SystemClock", () => {
	it("returns the current time", () => {
		const before = Date.now();
		const now = new SystemClock().now().getTime();
		expect(now).toBeGreaterThanOrEqual(before);
		expect(now).toBeLessThanOrEqual(Date.now());
	});
});

describe("UuidGenerator", () => {
	it("generates distinct v4 uuids", () => {
		const ids = new UuidGenerator();
		const first = ids.generate();
		expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		expect(ids.generate()).not.toBe(first);
	});
});
