import { RefreshAheadCache } from "@server/infrastructure/repositories/warehouse/refresh-ahead-cache/refresh-ahead-cache";

function setup() {
	let now = 0;
	const cache = new RefreshAheadCache<string>({ now: () => now, ttlMs: 1000 });
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

async function settle() {
	for (let tick = 0; tick < 3; tick += 1) await Promise.resolve();
}

describe("RefreshAheadCache", () => {
	it("loads once and serves the value from memory before the refresh point", async () => {
		const { cache, advance } = setup();
		const load = vi.fn().mockResolvedValue("v1");

		await expect(cache.get("k", load)).resolves.toBe("v1");
		advance(799);
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

	it("refreshes in the background once near the end, still answering instantly", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(800);
		const next = deferred();
		const load = vi.fn().mockReturnValue(next.promise);

		await expect(cache.get("k", load)).resolves.toBe("v1");
		await expect(cache.get("k", load)).resolves.toBe("v1");
		expect(load).toHaveBeenCalledTimes(1);

		next.resolve("v2");
		await next.promise;
		await expect(cache.get("k", load)).resolves.toBe("v2");
	});

	it("never serves a value past its time to live", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(1000);
		const next = deferred();
		const load = vi.fn().mockReturnValue(next.promise);

		const answer = cache.get("k", load);
		next.resolve("v2");

		await expect(answer).resolves.toBe("v2");
	});

	it("waits for a refresh already running once the value has expired", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(900);
		const next = deferred();
		const load = vi.fn().mockReturnValue(next.promise);
		await cache.get("k", load);
		advance(200);

		const answer = cache.get("k", load);
		next.resolve("v2");

		await expect(answer).resolves.toBe("v2");
		expect(load).toHaveBeenCalledTimes(1);
	});

	it("keeps the current value when an early refresh fails, and retries on the next call", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(800);

		await expect(cache.get("k", () => Promise.reject(new Error("down")))).resolves.toBe("v1");
		await settle();
		await expect(cache.get("k", () => Promise.resolve("v2"))).resolves.toBe("v1");
		await settle();
		await expect(cache.get("k", () => Promise.resolve("v3"))).resolves.toBe("v2");
	});

	it("drops the value when a refresh fails after it expired", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(900);
		const next = deferred();
		await cache.get("k", () => next.promise);
		advance(200);
		next.reject(new Error("down"));
		await settle();

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
