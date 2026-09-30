import { UuidGenerator } from "@server/infrastructure/providers/system/uuid-generator/uuid-generator";

describe("UuidGenerator", () => {
	it("generates distinct v4 uuids", () => {
		const ids = new UuidGenerator();
		const first = ids.generate();
		expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		expect(ids.generate()).not.toBe(first);
	});
});
