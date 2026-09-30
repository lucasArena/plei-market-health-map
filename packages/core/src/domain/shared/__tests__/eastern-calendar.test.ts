import { addDays, easternDay } from "@core/domain/shared/eastern-calendar";

describe("easternDay", () => {
	it("uses the US Eastern calendar date", () => {
		expect(easternDay(new Date("2026-09-30T03:30:00Z"))).toBe("2026-09-29");
		expect(easternDay(new Date("2026-09-30T05:00:00Z"))).toBe("2026-09-30");
	});
});

describe("addDays", () => {
	it("moves by whole days across months", () => {
		expect(addDays("2026-09-29", 3)).toBe("2026-10-02");
		expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
	});
});
