import { CachedFacilityStatsRepository } from "@server/infrastructure/repositories/warehouse/cached-facility-stats-repository/cached-facility-stats-repository";

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
	cancelledLastWeek: 32,
	upcomingNextSevenDays: 41,
	lastPlayedDate: "2026-09-28",
	weeklyActivity: [],
	popularTimes: [],
};

const PLAYER_STATS = {
	uniquePlayersLast28Days: 126,
	uniquePlayersPrevious28Days: 120,
	activatedPlayersLast28Days: 24,
	activatedPlayersPrevious28Days: 20,
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
	it("caches each analytics kind independently per facility", async () => {
		const { repository, getReservationStats, getPlayerStats } = setup();
		const firstIds = ["292" as never, "698" as never];
		const reversedIds = ["698" as never, "292" as never];

		await repository.getReservationStats(firstIds);
		await repository.getReservationStats(reversedIds);
		await repository.getPlayerStats(firstIds);
		await repository.getPlayerStats(reversedIds);
		await repository.getReservationStats(["889" as never]);

		expect(getReservationStats).toHaveBeenCalledTimes(2);
		expect(getPlayerStats).toHaveBeenCalledTimes(1);
	});

	it("refreshes expired values and does not cache failures", async () => {
		const { repository, getReservationStats, getPlayerStats, advance } = setup();
		getPlayerStats.mockRejectedValueOnce(new Error("warehouse down"));

		await repository.getReservationStats(["889" as never]);
		advance(1000);
		await repository.getReservationStats(["889" as never]);
		await expect(repository.getPlayerStats(["889" as never])).rejects.toThrow("warehouse down");
		await expect(repository.getPlayerStats(["889" as never])).resolves.toEqual(PLAYER_STATS);

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

		await repository.getReservationStats(["889" as never]);
		await repository.getReservationStats(["889" as never]);

		expect(getReservationStats).toHaveBeenCalledTimes(1);
	});
});

describe("game comparison cache", () => {
	it("shares pending batches, expires results, and retries failed requests", async () => {
		const { repository, getGameComparisons, advance } = setup();
		await repository.getGameComparisons(["1" as never, "2" as never]);
		await repository.getGameComparisons(["2" as never, "1" as never]);
		expect(getGameComparisons).toHaveBeenCalledTimes(1);
		advance(1000);
		getGameComparisons.mockRejectedValueOnce(new Error("unavailable"));
		await expect(repository.getGameComparisons(["1" as never, "2" as never])).rejects.toThrow(
			"unavailable",
		);
		await expect(repository.getGameComparisons(["1" as never, "2" as never])).resolves.toEqual([]);
		expect(getGameComparisons).toHaveBeenCalledTimes(3);
	});
});
