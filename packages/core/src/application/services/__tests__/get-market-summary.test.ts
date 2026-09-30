import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { NotFoundError } from "@core/application/errors/not-found-error";
import { makeGetMarketPlayerStats } from "@core/application/services/get-market-player-stats";
import { makeGetMarketSummary } from "@core/application/services/get-market-summary";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { InMemoryFacilityStatsRepository } from "@core/application/testing/in-memory-facility-stats-repository";
import { asEntityId, Facility } from "@core/domain";

function facility(id: string, marketId: string, gamesLast28Days: number, memberIds: string[] = []) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId(marketId),
		marketName: `Market ${marketId}`,
		name: `Facility ${id}`,
		address: "1 Main St",
		location: { latitude: 39.96, longitude: -75.15 },
		avatarUrl: null,
		memberIds: memberIds.map(asEntityId),
		metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days, utilization: 0 },
	});
}

const COUNTS = {
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
	scheduledLastWeek: 80,
	cancelledLastWeek: 20,
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
		getMarketSummary: makeGetMarketSummary({ facilities: repository, stats }),
		getMarketPlayerStats: makeGetMarketPlayerStats({ facilities: repository, stats }),
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
		expect(summary.scope).toEqual({
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
		expect(summary.topFacilities.map((rank) => rank.id)).toEqual(["31", "292"]);
		expect(summary.topMarkets).toEqual([
			{
				id: "houston",
				name: "Market houston",
				facilityCount: 1,
				activeFacilityCount: 1,
				gamesLast28Days: 40,
			},
			{
				id: "philly",
				name: "Market philly",
				facilityCount: 2,
				activeFacilityCount: 1,
				gamesLast28Days: 16,
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
			uniquePlayersPeriodChangePercent: 5,
			activatedPlayersPeriodChangePercent: 20,
		});
		expect(stats.playerRequested).toEqual([["292", "698"]]);
		expect(stats.reservationRequested).toEqual([]);
	});

	it("reports an empty scope when no facility is visible", async () => {
		const { getMarketSummary } = setup([]);

		await expect(getMarketSummary()).resolves.toMatchObject({
			scope: { facilityCount: 0, activeFacilityCount: 0, marketCount: 0, activeMarketCount: 0 },
			topFacilities: [],
			topMarkets: [],
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
		expect(summary.scope).toEqual({
			facilityCount: 2,
			activeFacilityCount: 1,
			marketCount: 1,
			activeMarketCount: 1,
		});
		expect(summary.topFacilities.map((rank) => rank.id)).toEqual(["292"]);
		expect(summary.topMarkets.map((rank) => rank.id)).toEqual(["philly"]);
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
