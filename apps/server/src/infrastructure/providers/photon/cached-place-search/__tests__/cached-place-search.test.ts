import { CachedPlaceSearch } from "@server/infrastructure/providers/photon/cached-place-search/cached-place-search";

const PLACE = {
	id: "R1",
	name: "London",
	kind: "city" as const,
	context: "England, United Kingdom",
	location: { latitude: 51.5, longitude: -0.12 },
	bounds: null,
};

function setup(options = {}) {
	let now = 0;
	const search = vi.fn().mockResolvedValue([PLACE]);
	const places = new CachedPlaceSearch({ search }, { now: () => new Date(now) }, options);
	return { search, places, advance: (ms: number) => (now += ms) };
}

describe("CachedPlaceSearch", () => {
	it("answers repeat queries from the cache for a day", async () => {
		const { search, places, advance } = setup();

		await places.search("london", 5);
		advance(24 * 60 * 60 * 1000 - 1);
		await expect(places.search("london", 5)).resolves.toEqual([PLACE]);
		expect(search).toHaveBeenCalledTimes(1);

		advance(1);
		await places.search("london", 5);
		expect(search).toHaveBeenCalledTimes(2);
	});

	it("drops the oldest query when full and forgets failures", async () => {
		const { search, places } = setup({ maxEntries: 1, ttlMs: 1000 });

		await places.search("london", 5);
		await places.search("wichita", 5);
		await places.search("london", 5);
		expect(search).toHaveBeenCalledTimes(3);

		search.mockRejectedValueOnce(new Error("down"));
		await expect(places.search("paris", 5)).rejects.toThrow("down");
		await expect(places.search("paris", 5)).resolves.toEqual([PLACE]);
	});
});
