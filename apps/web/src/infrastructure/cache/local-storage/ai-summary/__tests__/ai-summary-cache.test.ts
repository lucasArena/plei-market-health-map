import {
	AI_SUMMARY_STORAGE_PREFIX,
	AiSummaryCache,
	aiSummaryCache,
} from "@/infrastructure/cache/local-storage/ai-summary/ai-summary-cache";

describe("AiSummaryCache", () => {
	beforeEach(() => localStorage.clear());

	it("keys summaries by subject, week and locale and keeps them in localStorage", () => {
		const cache = new AiSummaryCache();
		const key = cache.keyFor("facility-889", "2026-09-21", "en");
		expect(key).toBe("v5:facility-889:2026-09-21:en");
		expect(cache.keyFor("market:2", "2026-09-21", "pt-BR")).toBe("v5:market-2:2026-09-21:pt-BR");
		expect(cache.read(key)).toBeNull();

		cache.write(key, "Busy week.");

		expect(localStorage.getItem(`${AI_SUMMARY_STORAGE_PREFIX}${key}`)).toBe("Busy week.");
		expect(new AiSummaryCache().read(key)).toBe("Busy week.");
	});

	it("replaces an older week's summary for the same subject and locale", () => {
		const cache = new AiSummaryCache();
		localStorage.setItem("unrelated", "keep");
		cache.write("v3:889:2026-09-14:en", "Old week.");
		cache.write("v3:889:2026-09-14:pt-BR", "Semana antiga.");
		cache.write("v3:890:2026-09-14:en", "Other facility.");

		cache.write("v3:889:2026-09-21:en", "New week.");

		expect(cache.read("v3:889:2026-09-14:en")).toBeNull();
		expect(cache.read("v3:889:2026-09-14:pt-BR")).toBe("Semana antiga.");
		expect(cache.read("v3:890:2026-09-14:en")).toBe("Other facility.");
		expect(cache.read("v3:889:2026-09-21:en")).toBe("New week.");

		cache.clear();

		expect(cache.read("v3:889:2026-09-21:en")).toBeNull();
		expect(localStorage.getItem("unrelated")).toBe("keep");
	});

	it("does nothing without storage", () => {
		const cache = new AiSummaryCache(() => null);

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
		const cache = new AiSummaryCache(() => broken);

		expect(() => cache.write("889:2026-09-21:en", "Busy week.")).not.toThrow();
		expect(() => cache.clear()).not.toThrow();
		expect(cache.read("889:2026-09-21:en")).toBeNull();
	});

	it("uses no storage when the browser denies access", () => {
		const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
			throw new Error("denied");
		});

		expect(new AiSummaryCache().read("889:2026-09-21:en")).toBeNull();
		spy.mockRestore();
	});

	it("shares one cache across the app", () => {
		expect(aiSummaryCache).toBeInstanceOf(AiSummaryCache);
	});
});
