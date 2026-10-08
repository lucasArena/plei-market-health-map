import {
	CachedMarketAudienceRepository,
	MARKET_AUDIENCE_CACHE_MAX_ENTRIES,
	MARKET_AUDIENCE_CACHE_TTL_MS,
} from "@server/infrastructure/repositories/warehouse/cached-market-audience-repository/cached-market-audience-repository";

const PERIOD = {
	activeUsers: 10,
	activeUsersPrevious: 8,
	registrations: 2,
	registrationsPrevious: 1,
};

const COUNTS = { week: PERIOD, month: PERIOD };

const TODAY = "2026-10-08";

function setup(ttlMs?: number) {
	let now = 0;
	const getAudience = vi.fn().mockResolvedValue(COUNTS);
	const repository = new CachedMarketAudienceRepository(
		{ getAudience },
		{ now: () => new Date(now) },
		ttlMs,
	);
	return {
		getAudience,
		repository,
		advance: (ms: number) => {
			now += ms;
		},
	};
}

describe("CachedMarketAudienceRepository", () => {
	it("reuses a market's audience for the same local day until it expires", async () => {
		const { getAudience, repository, advance } = setup();

		await repository.getAudience("2", TODAY);
		await repository.getAudience("2", TODAY);
		advance(MARKET_AUDIENCE_CACHE_TTL_MS);
		await expect(repository.getAudience("2", TODAY)).resolves.toEqual(COUNTS);

		expect(getAudience).toHaveBeenCalledTimes(2);
	});

	it("keys by market and local day", async () => {
		const { getAudience, repository } = setup(1000);

		await repository.getAudience(null, TODAY);
		await repository.getAudience("2", TODAY);
		await repository.getAudience("2", "2026-10-09");
		await repository.getAudience(null, TODAY);

		expect(getAudience.mock.calls).toEqual([
			[null, TODAY],
			["2", TODAY],
			["2", "2026-10-09"],
		]);
	});

	it("does not keep a failed lookup", async () => {
		const { getAudience, repository } = setup(1000);
		getAudience.mockRejectedValueOnce(new Error("warehouse down"));

		await expect(repository.getAudience(null, TODAY)).rejects.toThrow("warehouse down");
		await expect(repository.getAudience(null, TODAY)).resolves.toEqual(COUNTS);

		expect(getAudience).toHaveBeenCalledTimes(2);
	});

	it("evicts the oldest entry once the cache is full", async () => {
		const { getAudience, repository } = setup(1000);

		for (let market = 0; market < MARKET_AUDIENCE_CACHE_MAX_ENTRIES; market += 1) {
			await repository.getAudience(String(market), TODAY);
		}
		await repository.getAudience("overflow", TODAY);
		await repository.getAudience("1", TODAY);
		await repository.getAudience("0", TODAY);

		expect(getAudience).toHaveBeenCalledTimes(MARKET_AUDIENCE_CACHE_MAX_ENTRIES + 2);
	});
});
