import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

describe("cache entry", () => {
	it("is expired from its expiry time on", () => {
		const entry = { expiresAt: 1000, value: Promise.resolve("v") };
		expect(isExpired(entry, 999)).toBe(false);
		expect(isExpired(entry, 1000)).toBe(true);
	});

	it("remembers a value and returns it", async () => {
		const cache = new Map<string, CacheEntry<string>>();

		await expect(remember(cache, "k", Promise.resolve("v"), 1000)).resolves.toBe("v");
		expect(cache.get("k")?.expiresAt).toBe(1000);
	});

	it("forgets a value that fails, unless a newer one replaced it", async () => {
		const cache = new Map<string, CacheEntry<string>>();
		await remember(cache, "k", Promise.reject(new Error("down")), 1000).catch(() => undefined);
		expect(cache.has("k")).toBe(false);

		let failOld: (error: Error) => void = () => undefined;
		const old = remember(cache, "k", new Promise<string>((_, reject) => (failOld = reject)), 1000);
		await remember(cache, "k", Promise.resolve("new"), 2000);
		failOld(new Error("down"));
		await old.catch(() => undefined);
		expect(cache.get("k")?.expiresAt).toBe(2000);
	});
});
