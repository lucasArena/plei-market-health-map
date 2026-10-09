import {
	CachedFacilityQualityRepository,
	FACILITY_QUALITY_CACHE_MAX_ENTRIES,
	FACILITY_QUALITY_CACHE_TTL_MS,
} from "@server/infrastructure/repositories/warehouse/cached-facility-quality-repository/cached-facility-quality-repository";

const QUALITY = { periods: {}, lowReviews: [] };

const TODAY = "2026-10-08";

function setup(ttlMs?: number) {
	let now = 0;
	const getQuality = vi.fn().mockResolvedValue(QUALITY);
	const repository = new CachedFacilityQualityRepository(
		{ getQuality },
		{ now: () => new Date(now) },
		ttlMs,
	);
	return {
		getQuality,
		repository,
		advance: (ms: number) => {
			now += ms;
		},
	};
}

describe("CachedFacilityQualityRepository", () => {
	it("reuses a facility's quality for the same local day for five minutes", async () => {
		const { getQuality, repository, advance } = setup();

		await repository.getQuality(["889", "963"] as never, TODAY);
		await repository.getQuality(["963", "889"] as never, TODAY);
		advance(FACILITY_QUALITY_CACHE_TTL_MS);
		await expect(repository.getQuality(["889", "963"] as never, TODAY)).resolves.toEqual(QUALITY);

		expect(FACILITY_QUALITY_CACHE_TTL_MS).toBe(300_000);
		expect(getQuality).toHaveBeenCalledTimes(2);
	});

	it("keys by facility ids and local day", async () => {
		const { getQuality, repository } = setup(1000);

		await repository.getQuality(["889"] as never, TODAY);
		await repository.getQuality(["889"] as never, "2026-10-09");
		await repository.getQuality(["963"] as never, TODAY);
		await repository.getQuality(["889"] as never, TODAY);

		expect(getQuality.mock.calls).toEqual([
			[["889"], TODAY],
			[["889"], "2026-10-09"],
			[["963"], TODAY],
		]);
	});

	it("does not keep a failed lookup", async () => {
		const { getQuality, repository } = setup(1000);
		getQuality.mockRejectedValueOnce(new Error("warehouse down"));

		await expect(repository.getQuality(["889"] as never, TODAY)).rejects.toThrow("warehouse down");
		await expect(repository.getQuality(["889"] as never, TODAY)).resolves.toEqual(QUALITY);

		expect(getQuality).toHaveBeenCalledTimes(2);
	});

	it("evicts the oldest entry once the cache is full", async () => {
		const { getQuality, repository } = setup(1000);

		for (let id = 0; id < FACILITY_QUALITY_CACHE_MAX_ENTRIES; id += 1) {
			await repository.getQuality([String(id)] as never, TODAY);
		}
		await repository.getQuality(["overflow"] as never, TODAY);
		await repository.getQuality(["1"] as never, TODAY);
		await repository.getQuality(["0"] as never, TODAY);

		expect(getQuality).toHaveBeenCalledTimes(FACILITY_QUALITY_CACHE_MAX_ENTRIES + 2);
	});

	it("drops expired entries before adding new ones", async () => {
		const { getQuality, repository, advance } = setup(1000);

		await repository.getQuality(["889"] as never, TODAY);
		advance(1000);
		await repository.getQuality(["963"] as never, TODAY);
		await repository.getQuality(["889"] as never, TODAY);

		expect(getQuality).toHaveBeenCalledTimes(3);
	});
});
