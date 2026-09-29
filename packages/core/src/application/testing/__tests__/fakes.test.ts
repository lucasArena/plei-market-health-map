import { SequentialIdGenerator } from "@core/application/testing/fakes";
import { asEntityId } from "@core/domain";

describe("SequentialIdGenerator", () => {
	it("throws once it runs out of identifiers", () => {
		const ids = new SequentialIdGenerator([asEntityId("one")]);
		expect(ids.generate()).toBe("one");
		expect(() => ids.generate()).toThrow("ran out");
	});
});
