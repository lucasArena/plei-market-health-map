import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { makeGetMarketGameInsights } from "@core/application/services/get-market-game-insights";
import { makeGetMarketPlayerStats } from "@core/application/services/get-market-player-stats";
import { makeGetMarketSummary } from "@core/application/services/get-market-summary";
import { FixedClock } from "@core/application/testing/fakes";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { InMemoryFacilityStatsRepository } from "@core/application/testing/in-memory-facility-stats-repository";
import { asEntityId, Facility, type GameDepartmentCounts } from "@core/domain";

const TEST_CLOCK = new FixedClock(new Date("2026-10-08T16:00:00Z"));

function facility(
	id: string,
	marketId: string,
	gamesLast28Days: number,
	memberIds: string[] = [],
	gamesLastWeek = 0,
) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId(marketId),
		marketName: `Market ${marketId}`,
		name: `Facility ${id}`,
		address: "1 Main St",
		location: { latitude: 39.96, longitude: -75.15 },
		avatarUrl: null,
		memberIds: memberIds.map(asEntityId),
		metrics: { activePlayers: 0, gamesLastWeek, gamesLast28Days, utilization: 0 },
	});
}

const COUNTS = {
	periodStart: "2026-09-03",
	periodEnd: "2026-09-30",
	weekStart: "2026-09-21",
	playedLastWeek: 55,
	playedPreviousWeek: 50,
	playedLast28Days: 212,
	playedPrevious28Days: 200,
	scheduledLast28Days: 250,
	scheduledPrevious28Days: 240,
	uniquePlayersLast28Days: 126,
	uniquePlayersPrevious28Days: 120,
	activatedPlayersLast28Days: 24,
	activatedPlayersPrevious28Days: 20,
	weeklyActivatedPlayers: [],
	uniquePlayersLastWeek: 30,
	uniquePlayersPreviousWeek: 25,
	activatedPlayersLastWeek: 6,
	activatedPlayersPreviousWeek: 5,
	scheduledLastWeek: 80,
	scheduledPreviousWeek: 80,
	cancelledLastWeek: 20,
	cancelledPreviousWeek: 20,
	cancelledLast28Days: 80,
	cancelledPrevious28Days: 80,
	upcomingNextSevenDays: 41,
	lastPlayedDate: "2026-09-28",
	weeklyActivity: [],
	popularTimes: [],
};

function setup(facilities: Facility[]) {
	const repository = new InMemoryFacilityRepository(facilities);
	const stats = new InMemoryFacilityStatsRepository(COUNTS);
	return {
		stats,
		getMarketSummary: makeGetMarketSummary({ clock: TEST_CLOCK, facilities: repository, stats }),
		getMarketPlayerStats: makeGetMarketPlayerStats({
			clock: TEST_CLOCK,
			facilities: repository,
			stats,
		}),
	};
}

describe("market summary", () => {
	it("aggregates reservation analytics across every visible facility member in one request", async () => {
		const { getMarketSummary, stats } = setup([
			facility("292", "philly", 16, ["698"]),
			facility("10", "philly", 0),
			facility("31", "houston", 40),
		]);

		const summary = await getMarketSummary();

		expect(stats.reservationRequested).toEqual([["292", "698", "10", "31"]]);
		expect(stats.playerRequested).toEqual([]);
		expect(summary.periods.month.scope).toEqual({
			facilityCount: 3,
			activeFacilityCount: 2,
			marketCount: 2,
			activeMarketCount: 2,
		});
		expect(summary.stats).toMatchObject({
			playedLast28Days: 212,
			playedPeriodChangePercent: 6,
			confirmationRate: 84.8,
			cancellationRate: 25,
		});
		expect(summary.periods.month.topFacilities.map((rank) => rank.id)).toEqual(["31", "292"]);
		expect(summary.periods.month.topMarkets).toEqual([
			{
				id: "houston",
				name: "Market houston",
				facilityCount: 1,
				activeFacilityCount: 1,
				games: 40,
			},
			{
				id: "philly",
				name: "Market philly",
				facilityCount: 2,
				activeFacilityCount: 1,
				games: 16,
			},
		]);
	});

	it("aggregates player analytics separately so the slower query never blocks the report", async () => {
		const { getMarketPlayerStats, stats } = setup([facility("292", "philly", 16, ["698"])]);

		await expect(getMarketPlayerStats()).resolves.toEqual({
			uniquePlayersLast28Days: 126,
			uniquePlayersPrevious28Days: 120,
			activatedPlayersLast28Days: 24,
			activatedPlayersPrevious28Days: 20,
			weeklyActivatedPlayers: [],
			uniquePlayersLastWeek: 30,
			uniquePlayersPreviousWeek: 25,
			activatedPlayersLastWeek: 6,
			activatedPlayersPreviousWeek: 5,
			uniquePlayersPeriodChangePercent: 5,
			activatedPlayersPeriodChangePercent: 20,
		});
		expect(stats.playerRequested).toEqual([["292", "698"]]);
		expect(stats.reservationRequested).toEqual([]);
	});

	it("reports an empty scope when no facility is visible", async () => {
		const { getMarketSummary } = setup([]);

		const empty = {
			scope: { facilityCount: 0, activeFacilityCount: 0, marketCount: 0, activeMarketCount: 0 },
			topFacilities: [],
			topMarkets: [],
		};
		await expect(getMarketSummary()).resolves.toMatchObject({
			periods: { week: empty, month: empty },
		});
	});

	it("scopes the summary and rankings to one market when asked", async () => {
		const { getMarketSummary, stats } = setup([
			facility("292", "philly", 16, ["698"]),
			facility("10", "philly", 0),
			facility("31", "houston", 40),
		]);

		const summary = await getMarketSummary({ market: " philly " });

		expect(stats.reservationRequested).toEqual([["292", "698", "10"]]);
		expect(summary.periods.month.scope).toEqual({
			facilityCount: 2,
			activeFacilityCount: 1,
			marketCount: 1,
			activeMarketCount: 1,
		});
		expect(summary.periods.month.topFacilities.map((rank) => rank.id)).toEqual(["292"]);
		expect(summary.periods.month.topMarkets.map((rank) => rank.id)).toEqual(["philly"]);
	});

	it("ranks and counts active facilities by last week's games for the week", async () => {
		const { getMarketSummary } = setup([
			facility("292", "philly", 16, [], 3),
			facility("10", "philly", 20, [], 0),
			facility("31", "houston", 40, [], 1),
		]);

		const { periods } = await getMarketSummary();

		expect(periods.week.scope).toMatchObject({ activeFacilityCount: 2, activeMarketCount: 2 });
		expect(periods.week.topFacilities.map((rank) => [rank.id, rank.games])).toEqual([
			["292", 3],
			["31", 1],
		]);
		expect(periods.week.topMarkets.map((rank) => [rank.id, rank.games])).toEqual([
			["philly", 3],
			["houston", 1],
		]);
		expect(periods.month.scope.activeFacilityCount).toBe(3);
	});

	it("scopes player analytics to one market when asked", async () => {
		const { getMarketPlayerStats, stats } = setup([
			facility("292", "philly", 16, ["698"]),
			facility("31", "houston", 40),
		]);

		await getMarketPlayerStats({ market: "houston" });

		expect(stats.playerRequested).toEqual([["31"]]);
	});

	it("rejects an unknown market as not found before querying analytics", async () => {
		const { getMarketSummary, getMarketPlayerStats, stats } = setup([
			facility("292", "philly", 16),
		]);

		await expect(getMarketSummary({ market: "nowhere" })).rejects.toBeInstanceOf(NotFoundError);
		await expect(getMarketPlayerStats({ market: "nowhere" })).rejects.toBeInstanceOf(NotFoundError);
		expect(stats.reservationRequested).toEqual([]);
		expect(stats.playerRequested).toEqual([]);
	});

	it("rejects a blank market as an invalid request", async () => {
		const { getMarketSummary, getMarketPlayerStats } = setup([facility("292", "philly", 16)]);

		await expect(getMarketSummary({ market: "  " })).rejects.toBeInstanceOf(InvalidRequestError);
		await expect(getMarketPlayerStats({ market: "" })).rejects.toBeInstanceOf(InvalidRequestError);
	});
});

it("returns game comparisons for every market, including inactive facilities", async () => {
	const facilities = new InMemoryFacilityRepository([
		facility("1", "houston", 0),
		facility("2", "philly", 50),
	]);
	const stats = new InMemoryFacilityStatsRepository(COUNTS, [
		{
			facilityId: asEntityId("1"),
			playedLastWeek: 3,
			playedPreviousWeek: 6,
			playedLast28Days: 0,
			playedPrevious28Days: 100,
		},
		{
			facilityId: asEntityId("2"),
			playedLastWeek: 10,
			playedPreviousWeek: 5,
			playedLast28Days: 50,
			playedPrevious28Days: 25,
		},
	]);
	const insights = makeGetMarketGameInsights({ clock: TEST_CLOCK, facilities, stats });
	expect(await insights({ period: "month" })).toMatchObject([
		{ id: "houston", change: -100, changePercent: -100 },
		{ id: "philly", change: 25, changePercent: 100 },
	]);
	expect(await insights()).toMatchObject([
		{ id: "houston", played: 3, playedPrevious: 6, change: -3, changePercent: -50 },
		{ id: "philly", played: 10, playedPrevious: 5, change: 5, changePercent: 100 },
	]);
	const selected = await insights({ market: "houston" });
	expect(selected.map((market) => market.id)).toEqual(["houston"]);
});

it("loads the main report without invoking slow or failing insight analytics", async () => {
	const facilities = new InMemoryFacilityRepository([facility("1", "houston", 20)]);
	const stats = new InMemoryFacilityStatsRepository(COUNTS);
	const comparisons = vi
		.spyOn(stats, "getGameComparisons")
		.mockImplementation(() => new Promise(() => undefined));
	const result = await makeGetMarketSummary({ clock: TEST_CLOCK, facilities, stats })();
	expect(result.stats.playedLast28Days).toBe(212);
	expect(comparisons).not.toHaveBeenCalled();
});
it("validates insight scope before requesting comparisons", async () => {
	const facilities = new InMemoryFacilityRepository([facility("1", "houston", 20)]);
	const stats = new InMemoryFacilityStatsRepository(COUNTS);
	const comparisons = vi.spyOn(stats, "getGameComparisons");
	const insights = makeGetMarketGameInsights({ clock: TEST_CLOCK, facilities, stats });
	await expect(insights({ market: " " })).rejects.toBeInstanceOf(InvalidRequestError);
	await expect(insights({ market: "unknown" })).rejects.toBeInstanceOf(NotFoundError);
	await expect(insights({ period: "year" as never })).rejects.toBeInstanceOf(InvalidRequestError);
	expect(comparisons).not.toHaveBeenCalled();
});

function departments(
	magic: number,
	organizers: number,
	partnerships: number,
): GameDepartmentCounts {
	return { magic, organizers, partnerships };
}

function departmentFacility(id: string, marketId: string, month: GameDepartmentCounts) {
	const total = month.magic + month.organizers + month.partnerships;
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId(marketId),
		marketName: `Market ${marketId}`,
		name: `Facility ${id}`,
		address: "1 Main St",
		location: { latitude: 39.96, longitude: -75.15 },
		avatarUrl: null,
		metrics: {
			activePlayers: 0,
			gamesLastWeek: Math.round(total / 4),
			gamesLast28Days: total,
			gamesByDepartment: month,
			gamesPrevious28Days: total * 2,
			gamesPreviousByDepartment: departments(
				month.magic * 2,
				month.organizers * 2,
				month.partnerships * 2,
			),
			gamesLastWeekByDepartment: departments(
				Math.round(month.magic / 4),
				Math.round(month.organizers / 4),
				Math.round(month.partnerships / 4),
			),
			gamesPreviousWeek: 0,
			gamesPreviousWeekByDepartment: departments(0, 0, 0),
			utilization: 0,
		},
	});
}

describe("market summary game department filter", () => {
	const facilities = () => [
		departmentFacility("1", "philly", departments(8, 0, 4)),
		departmentFacility("2", "philly", departments(0, 12, 0)),
		departmentFacility("3", "houston", departments(0, 0, 20)),
	];

	it("counts, ranks and asks for reservation stats with only the selected departments", async () => {
		const { getMarketSummary, stats } = setup(facilities());

		const summary = await getMarketSummary({ departments: ["organizers", "magic"] });

		expect(stats.reservationFilters).toEqual([{ departments: ["magic", "organizers"] }]);
		expect(stats.reservationRequested).toEqual([["1", "2", "3"]]);
		expect(summary.periods.month.scope).toEqual({
			facilityCount: 3,
			activeFacilityCount: 2,
			marketCount: 2,
			activeMarketCount: 1,
		});
		expect(summary.periods.month.topFacilities.map((rank) => [rank.id, rank.games])).toEqual([
			["2", 12],
			["1", 8],
		]);
		expect(summary.periods.month.topMarkets).toEqual([
			{ id: "philly", name: "Market philly", facilityCount: 2, activeFacilityCount: 2, games: 20 },
		]);
		expect(summary.periods.week.topFacilities.map((rank) => [rank.id, rank.games])).toEqual([
			["2", 3],
			["1", 2],
		]);
	});

	it("keeps the unfiltered request when no department or every department is picked", async () => {
		const { getMarketSummary, stats } = setup(facilities());

		const all = await getMarketSummary({ departments: ["magic", "organizers", "partnerships"] });
		const none = await getMarketSummary({ departments: [] });
		const omitted = await getMarketSummary();

		expect(stats.reservationFilters).toEqual([undefined, undefined, undefined]);
		expect(all).toEqual(omitted);
		expect(none).toEqual(omitted);
		expect(omitted.periods.month.scope.activeFacilityCount).toBe(3);
	});

	it("asks for player stats with only the selected departments", async () => {
		const { getMarketPlayerStats, stats } = setup(facilities());

		await getMarketPlayerStats({ departments: ["partnerships", "magic"], market: "philly" });

		expect(stats.playerFilters).toEqual([{ departments: ["magic", "partnerships"] }]);
		expect(stats.playerRequested).toEqual([["1", "2"]]);
	});

	it("keeps the unfiltered player request when no department or every department is picked", async () => {
		const { getMarketPlayerStats, stats } = setup(facilities());

		const all = await getMarketPlayerStats({
			departments: ["magic", "organizers", "partnerships"],
		});
		const none = await getMarketPlayerStats({ departments: [] });
		const omitted = await getMarketPlayerStats();

		expect(stats.playerFilters).toEqual([undefined, undefined, undefined]);
		expect(all).toEqual(omitted);
		expect(none).toEqual(omitted);
	});

	it("rejects an unknown department as an invalid request", async () => {
		const { getMarketSummary, stats } = setup(facilities());

		await expect(getMarketSummary({ departments: ["chess" as never] })).rejects.toBeInstanceOf(
			InvalidRequestError,
		);
		expect(stats.reservationRequested).toEqual([]);
	});

	it("builds insights from the department windows without the warehouse comparison", async () => {
		const repository = new InMemoryFacilityRepository(facilities());
		const stats = new InMemoryFacilityStatsRepository(COUNTS);
		const comparisons = vi.spyOn(stats, "getGameComparisons");
		const insights = makeGetMarketGameInsights({
			clock: TEST_CLOCK,
			facilities: repository,
			stats,
		});

		const month = await insights({ period: "month", departments: ["partnerships"] });

		expect(comparisons).not.toHaveBeenCalled();
		expect(month).toMatchObject([
			{ id: "philly", played: 4, playedPrevious: 8, change: -4, changePercent: -50 },
			{ id: "houston", played: 20, playedPrevious: 40, change: -20, changePercent: -50 },
		]);
		const [philly] = await insights({ period: "week", departments: ["magic"], market: "philly" });
		expect(philly).toMatchObject({ id: "philly", played: 2, playedPrevious: 0 });
		expect(philly?.facilities.map((row) => [row.id, row.played])).toEqual([
			["1", 2],
			["2", 0],
		]);
	});
});

describe("viewer's local today", () => {
	it("sends the same local today to the facility list and every stats query", async () => {
		const facilities = new InMemoryFacilityRepository([facility("1", "philly", 3)]);
		const stats = new InMemoryFacilityStatsRepository(COUNTS, [
			{
				facilityId: asEntityId("1"),
				playedLastWeek: 1,
				playedPreviousWeek: 1,
				playedLast28Days: 3,
				playedPrevious28Days: 2,
			},
		]);
		const lateEveningInLosAngeles = new FixedClock(new Date("2026-10-09T05:00:00Z"));
		const deps = { clock: lateEveningInLosAngeles, facilities, stats };

		await makeGetMarketSummary(deps)({ timeZone: "America/Los_Angeles" });
		await makeGetMarketGameInsights(deps)({ timeZone: "America/Los_Angeles" });
		await makeGetMarketPlayerStats(deps)({ timeZone: "America/Los_Angeles" });
		await makeGetMarketSummary(deps)({ timeZone: "America/New_York" });
		await makeGetMarketSummary(deps)({ timeZone: "Not/AZone" });

		expect(facilities.requestedDays).toEqual([
			"2026-10-08",
			"2026-10-08",
			"2026-10-08",
			"2026-10-09",
			"2026-10-09",
		]);
		expect(stats.requestedDays).toEqual([
			"2026-10-08",
			"2026-10-08",
			"2026-10-08",
			"2026-10-09",
			"2026-10-09",
		]);
	});
});
