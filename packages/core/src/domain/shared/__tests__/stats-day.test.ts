import {
	DEFAULT_STATS_TIME_ZONE,
	localDay,
	resolveStatsTimeZone,
	statsWindow,
} from "@core/domain/shared/stats-day";
import { describe, expect, it } from "vitest";

describe("resolveStatsTimeZone", () => {
	it("keeps a valid IANA zone", () => {
		expect(resolveStatsTimeZone("America/Los_Angeles")).toBe("America/Los_Angeles");
		expect(resolveStatsTimeZone("America/Sao_Paulo")).toBe("America/Sao_Paulo");
	});

	it("falls back to New York when missing, blank, too long or unknown", () => {
		for (const value of [undefined, null, "", "  ", "Mars/Olympus", "x".repeat(65), "'; drop"]) {
			expect(resolveStatsTimeZone(value)).toBe(DEFAULT_STATS_TIME_ZONE);
		}
	});
});

describe("localDay", () => {
	it("reads the date in the viewer's zone, so zones can be a day apart", () => {
		const lateEvening = new Date("2026-10-09T02:30:00Z");
		expect(localDay(lateEvening, "America/New_York")).toBe("2026-10-08");
		expect(localDay(lateEvening, "America/Los_Angeles")).toBe("2026-10-08");
		expect(localDay(lateEvening, "America/Sao_Paulo")).toBe("2026-10-08");
		expect(localDay(new Date("2026-10-09T04:30:00Z"), "America/New_York")).toBe("2026-10-09");
		expect(localDay(new Date("2026-10-09T04:30:00Z"), "America/Los_Angeles")).toBe("2026-10-08");
	});

	it("uses New York for an unknown zone", () => {
		expect(localDay(new Date("2026-10-09T03:30:00Z"), "Nowhere/Land")).toBe("2026-10-08");
	});
});

describe("statsWindow", () => {
	it("covers the 7 full days ending yesterday and the 7 before", () => {
		expect(statsWindow("2026-10-08", 7)).toEqual({
			start: "2026-10-01",
			end: "2026-10-07",
			previousStart: "2026-09-24",
			previousEnd: "2026-09-30",
		});
	});

	it("covers the 28 full days ending yesterday and the 28 before", () => {
		expect(statsWindow("2026-10-08", 28)).toEqual({
			start: "2026-09-10",
			end: "2026-10-07",
			previousStart: "2026-08-13",
			previousEnd: "2026-09-09",
		});
	});
});
