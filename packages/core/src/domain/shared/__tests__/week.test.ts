import { lastCompletedWeekStart, weekEndOf, weekStartOf } from "@core/domain/shared/week";

describe("weekStartOf", () => {
	it("puts a Sunday in the week that started the Monday before", () => {
		expect(weekStartOf("2026-09-27")).toBe("2026-09-21");
	});

	it("starts a new week on Monday", () => {
		expect(weekStartOf("2026-09-28")).toBe("2026-09-28");
		expect(weekStartOf("2026-09-21")).toBe("2026-09-21");
	});
});

describe("weekEndOf", () => {
	it("returns the Sunday that ends the week", () => {
		expect(weekEndOf("2026-09-21")).toBe("2026-09-27");
	});

	it("crosses month and year boundaries", () => {
		expect(weekEndOf("2026-08-31")).toBe("2026-09-06");
		expect(weekEndOf("2026-12-28")).toBe("2027-01-03");
	});
});

describe("lastCompletedWeekStart", () => {
	it("leaves out the current week in progress", () => {
		expect(lastCompletedWeekStart(new Date("2026-09-30T12:00:00Z"))).toBe("2026-09-21");
	});

	it("still treats Sunday as part of the week in progress", () => {
		expect(lastCompletedWeekStart(new Date("2026-09-27T23:00:00Z"))).toBe("2026-09-14");
	});

	it("moves to the week that just ended on Monday", () => {
		expect(lastCompletedWeekStart(new Date("2026-09-28T00:00:00Z"))).toBe("2026-09-21");
	});
});
