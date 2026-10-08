import {
	CachedFacilityStatsRepository,
	FACILITY_PLAYER_STATS_CACHE_TTL_MS,
} from "@server/infrastructure/repositories/warehouse/cached-facility-stats-repository/cached-facility-stats-repository";

const RESERVATION_STATS = {
	periodStart: "2026-09-03",
	periodEnd: "2026-09-30",
	weekStart: "2026-09-21",
	playedLastWeek: 55,
	playedPreviousWeek: 51,
	playedLast28Days: 212,
	playedPrevious28Days: 200,
	scheduledLast28Days: 250,
	scheduledPrevious28Days: 240,
	scheduledLastWeek: 87,
	scheduledPreviousWeek: 87,
	cancelledLastWeek: 32,
	cancelledPreviousWeek: 32,
	cancelledLast28Days: 128,
	cancelledPrevious28Days: 128,
	upcomingNextSevenDays: 41,
	lastPlayedDate: "2026-09-28",
	weeklyActivity: [],
	popularTimes: [],
};

const TODAY = "2026-10-08";

const PLAYER_STATS = {
	uniquePlayersLast28Days: 126,
	uniquePlayersPrevious28Days: 120,
	activatedPlayersLast28Days: 24,
	activatedPlayersPrevious28Days: 20,
	uniquePlayersLastWeek: 30,
	uniquePlayersPreviousWeek: 25,
	activatedPlayersLastWeek: 6,
	activatedPlayersPreviousWeek: 5,
};

function setup() {
	let now = 0;
	const getReservationStats = vi.fn().mockResolvedValue(RESERVATION_STATS);
	const getPlayerStats = vi.fn().mockResolvedValue(PLAYER_STATS);
	const getGameComparisons = vi.fn().mockResolvedValue([]);
	const repository = new CachedFacilityStatsRepository(
		{ getReservationStats, getPlayerStats, getGameComparisons },
		{ now: () => new Date(now) },
		1000,
	);
	return {
		getReservationStats,
		getPlayerStats,
		getGameComparisons,
		repository,
		advance: (ms: number) => (now += ms),
	};
}

describe("CachedFacilityStatsRepository", () => {
	it("keeps a separate reservation entry per department filter, in any order", async () => {
		const { repository, getReservationStats } = setup();
		const ids = ["292" as never, "698" as never];

		await repository.getReservationStats(ids, TODAY);
		await repository.getReservationStats(ids, TODAY, { departments: [] });
		await repository.getReservationStats(ids, TODAY, { departments: ["organizers", "magic"] });
		await repository.getReservationStats([...ids].reverse(), TODAY, {
			departments: ["magic", "organizers"],
		});
		await repository.getReservationStats(ids, TODAY, { departments: ["partnerships"] });
		await repository.getReservationStats(ids, TODAY, {
			departments: ["magic", "organizers", "partnerships"],
		});

		expect(getReservationStats).toHaveBeenCalledTimes(3);
		expect(getReservationStats).toHaveBeenNthCalledWith(1, ids, TODAY);
		expect(getReservationStats).toHaveBeenNthCalledWith(2, ids, TODAY, {
			departments: ["magic", "organizers"],
		});
		expect(getReservationStats).toHaveBeenNthCalledWith(3, ids, TODAY, {
			departments: ["partnerships"],
		});
	});

	it("caches each analytics kind independently per facility", async () => {
		const { repository, getReservationStats, getPlayerStats } = setup();
		const firstIds = ["292" as never, "698" as never];
		const reversedIds = ["698" as never, "292" as never];

		await repository.getReservationStats(firstIds, TODAY);
		await repository.getReservationStats(reversedIds, TODAY);
		await repository.getPlayerStats(firstIds, TODAY);
		await repository.getPlayerStats(reversedIds, TODAY);
		await repository.getReservationStats(["889" as never], TODAY);

		expect(getReservationStats).toHaveBeenCalledTimes(2);
		expect(getPlayerStats).toHaveBeenCalledTimes(1);
	});

	it("refreshes expired values and does not cache failures", async () => {
		const { repository, getReservationStats, getPlayerStats, advance } = setup();
		getPlayerStats.mockRejectedValueOnce(new Error("warehouse down"));

		await repository.getReservationStats(["889" as never], TODAY);
		advance(1000);
		await repository.getReservationStats(["889" as never], TODAY);
		await expect(repository.getPlayerStats(["889" as never], TODAY)).rejects.toThrow(
			"warehouse down",
		);
		await expect(repository.getPlayerStats(["889" as never], TODAY)).resolves.toEqual(PLAYER_STATS);

		expect(getReservationStats).toHaveBeenCalledTimes(2);
		expect(getPlayerStats).toHaveBeenCalledTimes(2);
	});

	it("uses a five-minute cache by default", async () => {
		const getReservationStats = vi.fn().mockResolvedValue(RESERVATION_STATS);
		const getPlayerStats = vi.fn().mockResolvedValue(PLAYER_STATS);
		const getGameComparisons = vi.fn().mockResolvedValue([]);
		const repository = new CachedFacilityStatsRepository(
			{ getReservationStats, getPlayerStats, getGameComparisons },
			{ now: () => new Date(0) },
		);

		await repository.getReservationStats(["889" as never], TODAY);
		await repository.getReservationStats(["889" as never], TODAY);

		expect(getReservationStats).toHaveBeenCalledTimes(1);
	});

	it("keeps player stats for an hour, since they only cover completed weeks", async () => {
		let now = 0;
		const getPlayerStats = vi.fn().mockResolvedValue(PLAYER_STATS);
		const repository = new CachedFacilityStatsRepository(
			{
				getReservationStats: vi.fn().mockResolvedValue(RESERVATION_STATS),
				getPlayerStats,
				getGameComparisons: vi.fn().mockResolvedValue([]),
			},
			{ now: () => new Date(now) },
		);

		await repository.getPlayerStats(["1" as never], TODAY);
		now = FACILITY_PLAYER_STATS_CACHE_TTL_MS - 1;
		await repository.getPlayerStats(["1" as never], TODAY);
		expect(getPlayerStats).toHaveBeenCalledTimes(1);
		now = FACILITY_PLAYER_STATS_CACHE_TTL_MS;
		await repository.getPlayerStats(["1" as never], TODAY);
		expect(getPlayerStats).toHaveBeenCalledTimes(2);
		expect(FACILITY_PLAYER_STATS_CACHE_TTL_MS).toBe(60 * 60 * 1000);
	});
});

describe("game comparison cache", () => {
	it("shares batches, expires results after the time to live, and retries failed requests", async () => {
		const { repository, getGameComparisons, advance } = setup();
		await repository.getGameComparisons(["1" as never, "2" as never], TODAY);
		await repository.getGameComparisons(["2" as never, "1" as never], TODAY);
		expect(getGameComparisons).toHaveBeenCalledTimes(1);
		advance(1000);
		getGameComparisons.mockRejectedValueOnce(new Error("unavailable"));
		await expect(
			repository.getGameComparisons(["1" as never, "2" as never], TODAY),
		).rejects.toThrow("unavailable");
		await expect(
			repository.getGameComparisons(["1" as never, "2" as never], TODAY),
		).resolves.toEqual([]);
		expect(getGameComparisons).toHaveBeenCalledTimes(3);
	});
});

describe("viewer's today in the cache key", () => {
	it("never shares stats between viewers whose local dates differ", async () => {
		const { repository, getReservationStats, getPlayerStats, getGameComparisons } = setup();
		const ids = ["1" as never];
		for (const today of ["2026-10-08", "2026-10-09", "2026-10-08"]) {
			await repository.getReservationStats(ids, today);
			await repository.getReservationStats(ids, today, { departments: ["magic"] });
			await repository.getPlayerStats(ids, today);
			await repository.getGameComparisons(ids, today);
		}
		expect(getReservationStats).toHaveBeenCalledTimes(4);
		expect(getPlayerStats.mock.calls.map((call) => call[1])).toEqual(["2026-10-08", "2026-10-09"]);
		expect(getGameComparisons.mock.calls.map((call) => call[1])).toEqual([
			"2026-10-08",
			"2026-10-09",
		]);
	});
});

describe("player stats department filter", () => {
	it("keeps one player entry per department set, sharing the unfiltered one with every department", async () => {
		const { repository, getPlayerStats } = setup();
		const ids = ["292" as never, "698" as never];

		await repository.getPlayerStats(ids, TODAY);
		await repository.getPlayerStats(ids, TODAY, { departments: [] });
		await repository.getPlayerStats(ids, TODAY, {
			departments: ["magic", "organizers", "partnerships"],
		});
		await repository.getPlayerStats(ids, TODAY, { departments: ["organizers", "magic"] });
		await repository.getPlayerStats([...ids].reverse(), TODAY, {
			departments: ["magic", "organizers"],
		});
		await repository.getPlayerStats(ids, TODAY, { departments: ["partnerships"] });
		await repository.getPlayerStats(ids, "2026-10-09", { departments: ["partnerships"] });

		expect(getPlayerStats).toHaveBeenCalledTimes(4);
		expect(getPlayerStats).toHaveBeenNthCalledWith(1, ids, TODAY);
		expect(getPlayerStats).toHaveBeenNthCalledWith(2, ids, TODAY, {
			departments: ["magic", "organizers"],
		});
		expect(getPlayerStats).toHaveBeenNthCalledWith(3, ids, TODAY, {
			departments: ["partnerships"],
		});
		expect(getPlayerStats).toHaveBeenNthCalledWith(4, ids, "2026-10-09", {
			departments: ["partnerships"],
		});
	});
});
