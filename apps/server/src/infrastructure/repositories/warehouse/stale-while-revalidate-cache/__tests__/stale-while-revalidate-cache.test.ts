import { StaleWhileRevalidateCache } from "@server/infrastructure/repositories/warehouse/stale-while-revalidate-cache/stale-while-revalidate-cache";

function setup() {
	let now = 0;
	const cache = new StaleWhileRevalidateCache<string>({
		now: () => now,
		ttlMs: 1000,
		maxStaleMs: 5000,
	});
	return { cache, advance: (ms: number) => (now += ms) };
}

function deferred() {
	let resolve: (value: string) => void = () => undefined;
	let reject: (error: Error) => void = () => undefined;
	const promise = new Promise<string>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe("StaleWhileRevalidateCache", () => {
	it("loads once and serves fresh values from memory", async () => {
		const { cache, advance } = setup();
		const load = vi.fn().mockResolvedValue("v1");

		await expect(cache.get("k", load)).resolves.toBe("v1");
		advance(999);
		await expect(cache.get("k", load)).resolves.toBe("v1");
		expect(load).toHaveBeenCalledTimes(1);
	});

	it("shares one in-flight load between callers", async () => {
		const { cache } = setup();
		const first = deferred();
		const load = vi.fn().mockReturnValue(first.promise);

		const a = cache.get("k", load);
		const b = cache.get("k", load);
		first.resolve("v1");

		await expect(Promise.all([a, b])).resolves.toEqual(["v1", "v1"]);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it("answers with the stale value right away and refreshes it in the background once", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(1000);
		const next = deferred();
		const load = vi.fn().mockReturnValue(next.promise);

		await expect(cache.get("k", load)).resolves.toBe("v1");
		await expect(cache.get("k", load)).resolves.toBe("v1");
		expect(load).toHaveBeenCalledTimes(1);

		next.resolve("v2");
		await next.promise;
		await expect(cache.get("k", load)).resolves.toBe("v2");
	});

	it("keeps the stale value when a background refresh fails, and retries on the next call", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(1000);
		const failing = vi.fn().mockRejectedValue(new Error("warehouse down"));

		await expect(cache.get("k", failing)).resolves.toBe("v1");
		await Promise.resolve();
		await Promise.resolve();
		await expect(cache.get("k", () => Promise.resolve("v2"))).resolves.toBe("v1");
		await Promise.resolve();
		await expect(cache.get("k", failing)).resolves.toBe("v2");
	});

	it("waits for a fresh value once the entry is too old to serve", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(6000);

		await expect(cache.get("k", () => Promise.resolve("v2"))).resolves.toBe("v2");
	});

	it("does not keep failed first loads", async () => {
		const { cache } = setup();

		await expect(cache.get("k", () => Promise.reject(new Error("down")))).rejects.toThrow("down");
		await expect(cache.get("k", () => Promise.resolve("v1"))).resolves.toBe("v1");
	});

	it("keeps keys apart", async () => {
		const { cache } = setup();

		await cache.get("a", () => Promise.resolve("A"));
		await expect(cache.get("b", () => Promise.resolve("B"))).resolves.toBe("B");
		await expect(cache.get("a", () => Promise.resolve("X"))).resolves.toBe("A");
	});
});
