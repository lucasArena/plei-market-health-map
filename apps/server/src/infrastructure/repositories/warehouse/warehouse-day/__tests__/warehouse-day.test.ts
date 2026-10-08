import {
	inLastDaysSql,
	inPreviousDaysSql,
	MONTH_DAYS,
	todayParameterSql,
	WEEK_DAYS,
} from "@server/infrastructure/repositories/warehouse/warehouse-day/warehouse-day";
import { describe, expect, it } from "vitest";

describe("warehouse day", () => {
	it("binds today as a date parameter instead of reading the session clock", () => {
		expect(todayParameterSql(2)).toBe("$2::date");
		expect(todayParameterSql(2)).not.toContain("current_date");
		expect(todayParameterSql(2)).not.toContain("now()");
	});

	it("uses 7 and 28 day windows", () => {
		expect(WEEK_DAYS).toBe(7);
		expect(MONTH_DAYS).toBe(28);
	});

	it("ends every window the day before today", () => {
		expect(inLastDaysSql("d", "b.today", 7)).toBe("d >= b.today - 7 and d < b.today");
		expect(inPreviousDaysSql("d", "b.today", 7)).toBe("d >= b.today - 14 and d < b.today - 7");
		expect(inLastDaysSql("d", "b.today", 28)).toBe("d >= b.today - 28 and d < b.today");
		expect(inPreviousDaysSql("d", "b.today", 28)).toBe("d >= b.today - 56 and d < b.today - 28");
	});
});
