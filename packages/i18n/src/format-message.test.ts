import { formatMessage } from "@i18n/format-message";

describe("formatMessage", () => {
	it("fills named placeholders", () => {
		expect(formatMessage("{count} facilities in {city}", { count: 3, city: "Austin" })).toBe(
			"3 facilities in Austin",
		);
	});

	it("keeps unknown placeholders intact", () => {
		expect(formatMessage("{count} of {total}", { count: 1 })).toBe("1 of {total}");
	});
});
