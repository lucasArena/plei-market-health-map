import { afterEach, describe, expect, it, vi } from "vitest";
import { browserTimeZone, statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";

function mockBrowserZone(timeZone: string | undefined) {
	vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
		timeZone,
	} as Intl.ResolvedDateTimeFormatOptions);
}

describe("stats day", () => {
	afterEach(() => vi.restoreAllMocks());

	it("reads the browser's zone and falls back to New York", () => {
		mockBrowserZone("America/Los_Angeles");
		expect(browserTimeZone()).toBe("America/Los_Angeles");
		mockBrowserZone(undefined);
		expect(browserTimeZone()).toBe("America/New_York");
	});

	it("keys by zone and local date, so zones a day apart never share a key", () => {
		const now = new Date("2026-10-09T04:30:00Z");
		mockBrowserZone("America/New_York");
		expect(statsDayKey(now)).toBe("America/New_York|2026-10-09");
		mockBrowserZone("America/Los_Angeles");
		expect(statsDayKey(now)).toBe("America/Los_Angeles|2026-10-08");
	});

	it("adds the zone to a path with or without a query", () => {
		mockBrowserZone("America/Sao_Paulo");
		expect(withStatsTimeZone("/api/v1/facilities")).toBe(
			"/api/v1/facilities?tz=America%2FSao_Paulo",
		);
		expect(withStatsTimeZone("/api/v1/market-summary?market=1")).toBe(
			"/api/v1/market-summary?market=1&tz=America%2FSao_Paulo",
		);
	});
});
