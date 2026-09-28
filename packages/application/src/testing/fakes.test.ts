import { SequentialIdGenerator } from "@application/testing/fakes";
import { asEntityId } from "@market-health-map/domain";

describe("SequentialIdGenerator", () => {
	it("throws once it runs out of identifiers", () => {
		const ids = new SequentialIdGenerator([asEntityId("one")]);
		expect(ids.generate()).toBe("one");
		expect(() => ids.generate()).toThrow("ran out");
	});
});
