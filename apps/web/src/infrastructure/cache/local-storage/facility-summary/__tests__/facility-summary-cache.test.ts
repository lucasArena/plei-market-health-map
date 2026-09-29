import { FACILITY_DETAIL } from "@/application/test/facility-detail";
import {
	FACILITY_SUMMARY_STORAGE_PREFIX,
	FacilitySummaryCache,
	facilitySummaryCache,
} from "@/infrastructure/cache/local-storage/facility-summary/facility-summary-cache";

describe("FacilitySummaryCache", () => {
	beforeEach(() => localStorage.clear());

	it("keys summaries by facility, week and locale and keeps them in localStorage", () => {
		const cache = new FacilitySummaryCache();
		const key = cache.keyFor(FACILITY_DETAIL, "en");
		expect(key).toBe("889:2026-09-21:en");
		expect(cache.read(key)).toBeNull();

		cache.write(key, "Busy week.");

		expect(localStorage.getItem(`${FACILITY_SUMMARY_STORAGE_PREFIX}${key}`)).toBe("Busy week.");
		expect(new FacilitySummaryCache().read(key)).toBe("Busy week.");
	});

	it("replaces an older week's summary for the same facility and locale", () => {
		const cache = new FacilitySummaryCache();
		localStorage.setItem("unrelated", "keep");
		cache.write("889:2026-09-14:en", "Old week.");
		cache.write("889:2026-09-14:pt-BR", "Semana antiga.");
		cache.write("890:2026-09-14:en", "Other facility.");

		cache.write("889:2026-09-21:en", "New week.");

		expect(cache.read("889:2026-09-14:en")).toBeNull();
		expect(cache.read("889:2026-09-14:pt-BR")).toBe("Semana antiga.");
		expect(cache.read("890:2026-09-14:en")).toBe("Other facility.");
		expect(cache.read("889:2026-09-21:en")).toBe("New week.");

		cache.clear();

		expect(cache.read("889:2026-09-21:en")).toBeNull();
		expect(localStorage.getItem("unrelated")).toBe("keep");
	});

	it("does nothing without storage", () => {
		const cache = new FacilitySummaryCache(() => null);

		cache.write("889:2026-09-21:en", "Busy week.");
		cache.clear();

		expect(cache.read("889:2026-09-21:en")).toBeNull();
	});

	it("never throws when storage is blocked or full", () => {
		const broken = {
			get length(): number {
				throw new Error("blocked");
			},
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("full");
			},
		} as unknown as Storage;
		const cache = new FacilitySummaryCache(() => broken);

		expect(() => cache.write("889:2026-09-21:en", "Busy week.")).not.toThrow();
		expect(() => cache.clear()).not.toThrow();
		expect(cache.read("889:2026-09-21:en")).toBeNull();
	});

	it("uses no storage when the browser denies access", () => {
		const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
			throw new Error("denied");
		});

		expect(new FacilitySummaryCache().read("889:2026-09-21:en")).toBeNull();
		spy.mockRestore();
	});

	it("shares one cache across the app", () => {
		expect(facilitySummaryCache).toBeInstanceOf(FacilitySummaryCache);
	});
});
