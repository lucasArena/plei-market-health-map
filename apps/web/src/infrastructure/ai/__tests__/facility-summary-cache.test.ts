import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import {
	clearCachedSummaries,
	readCachedSummary,
	summaryCacheKey,
	writeCachedSummary,
} from "@/infrastructure/ai/facility-summary-cache";

describe("facility summary cache", () => {
	it("keys summaries by facility, week and locale", () => {
		const key = summaryCacheKey(FACILITY_DETAIL, "en");
		expect(key).toBe("889:2026-09-21:en");
		expect(readCachedSummary(key)).toBeNull();

		writeCachedSummary(key, "Busy week.");
		expect(readCachedSummary(key)).toBe("Busy week.");

		clearCachedSummaries();
		expect(readCachedSummary(key)).toBeNull();
	});
});
