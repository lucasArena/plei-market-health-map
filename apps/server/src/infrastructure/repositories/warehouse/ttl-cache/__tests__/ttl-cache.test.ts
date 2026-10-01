import { TtlCache } from "@server/infrastructure/repositories/warehouse/ttl-cache/ttl-cache";

function setup() {
	let now = 0;
	const cache = new TtlCache<string>({ now: () => now, ttlMs: 1000 });
	return { cache, advance: (ms: number) => (now += ms) };
}

describe("TtlCache", () => {
	it("loads once and serves the cached value until it expires", async () => {
		const { cache, advance } = setup();
		const load = vi.fn().mockResolvedValue("v1");

		await expect(cache.get("k", load)).resolves.toBe("v1");
		advance(999);
		await expect(cache.get("k", load)).resolves.toBe("v1");
		expect(load).toHaveBeenCalledTimes(1);
	});

	it("loads again once the value has expired", async () => {
		const { cache, advance } = setup();
		await cache.get("k", () => Promise.resolve("v1"));
		advance(1000);

		await expect(cache.get("k", () => Promise.resolve("v2"))).resolves.toBe("v2");
	});

	it("shares one in-flight load between callers", async () => {
		const { cache } = setup();
		const load = vi.fn().mockResolvedValue("v1");

		await expect(Promise.all([cache.get("k", load), cache.get("k", load)])).resolves.toEqual([
			"v1",
			"v1",
		]);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it("does not keep failed loads", async () => {
		const { cache } = setup();

		await expect(cache.get("k", () => Promise.reject(new Error("down")))).rejects.toThrow("down");
		await expect(cache.get("k", () => Promise.resolve("v1"))).resolves.toBe("v1");
	});

	it("keeps a newer value when an older load fails late", async () => {
		const { cache, advance } = setup();
		let failOld: (error: Error) => void = () => undefined;
		const old = cache.get("k", () => new Promise<string>((_, reject) => (failOld = reject)));
		advance(1000);
		await cache.get("k", () => Promise.resolve("v2"));

		failOld(new Error("down"));
		await expect(old).rejects.toThrow("down");
		await expect(cache.get("k", () => Promise.resolve("v3"))).resolves.toBe("v2");
	});

	it("keeps keys apart", async () => {
		const { cache } = setup();

		await cache.get("a", () => Promise.resolve("A"));
		await expect(cache.get("b", () => Promise.resolve("B"))).resolves.toBe("B");
		await expect(cache.get("a", () => Promise.resolve("X"))).resolves.toBe("A");
	});
});
