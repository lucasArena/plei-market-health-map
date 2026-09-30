import {
	FACILITY_PLAYER_STATS_SQL,
	FACILITY_RESERVATION_STATS_SQL,
	toPlayerStats,
	toReservationStats,
	WarehouseFacilityStatsRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository";

const RESERVATION_ROW = {
	week_start: "2026-09-21",
	played_last_week: "55",
	played_previous_week: "51",
	played_last_28_days: "212",
	played_previous_28_days: "200",
	scheduled_last_28_days: "250",
	scheduled_previous_28_days: "240",
	scheduled_last_week: "87",
	cancelled_last_week: "32",
	upcoming_next_seven_days: "41",
	last_played_date: "2026-09-28",
	weekly_activity: [
		{ week_start: "2026-08-31", games_played: "48" },
		{ week_start: "2026-09-07", games_played: "58" },
		{ week_start: "2026-09-14", games_played: "51" },
		{ week_start: "2026-09-21", games_played: "55" },
	],
	popular_times: [{ day_of_week: "6", time_period: "2", games_played: "12" }],
};

const PLAYER_ROW = {
	unique_players_last_28_days: "126",
	unique_players_previous_28_days: "120",
	activated_players_last_28_days: "24",
	activated_players_previous_28_days: "20",
};

describe("facility stats SQL", () => {
	it("keeps reservation analytics bounded and free of player joins", () => {
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("r.reservation_type = 'OpenReservation'");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"r.cancellation_reason in ('Recurring game series', 'Operational changes')",
		);
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("g.confirmed and g.status <> 'cancelled'");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("where r.location_id = any($1::int[])");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("r.date_with_time::date >=");
		expect(FACILITY_RESERVATION_STATS_SQL).not.toContain("fct_games_opened");
		expect(FACILITY_RESERVATION_STATS_SQL).not.toContain("dim_player");
	});

	it("buckets weekly activity into completed Monday to Sunday weeks", () => {
		// Postgres date_trunc('week') starts weeks on Monday.
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"date_trunc('week', current_date)::date as this_week",
		);
		// A Sunday game falls before week_start + 7 and a Monday game starts the next week.
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"g.game_date >= w.week_start and g.game_date < w.week_start + 7",
		);
		// The last week is the one before this_week, so the week in progress is left out.
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"generate_series(b.this_week - 28, b.this_week - 7, interval '7 days')",
		);
	});

	it("queries current and previous 28-day player analytics separately", () => {
		expect(FACILITY_PLAYER_STATS_SQL).toContain("plei_gold.fct_games_opened");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("p.players_type = 'pleiapp_player'");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("player_lifecycle = 'Activated'");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("b.this_week - 56");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("b.this_week - 28");
		expect(FACILITY_PLAYER_STATS_SQL).not.toContain("dim_reservation");
	});
});

describe("warehouse facility stats mappers", () => {
	it("converts warehouse strings to numbers", () => {
		expect(toReservationStats(RESERVATION_ROW)).toEqual({
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
			weeklyActivity: [
				{ weekStart: "2026-08-31", gamesPlayed: 48 },
				{ weekStart: "2026-09-07", gamesPlayed: 58 },
				{ weekStart: "2026-09-14", gamesPlayed: 51 },
				{ weekStart: "2026-09-21", gamesPlayed: 55 },
			],
			popularTimes: [{ dayOfWeek: 6, timePeriod: 2, gamesPlayed: 12 }],
		});
		expect(toPlayerStats(PLAYER_ROW)).toEqual({
			uniquePlayersLast28Days: 126,
			uniquePlayersPrevious28Days: 120,
			activatedPlayersLast28Days: 24,
			activatedPlayersPrevious28Days: 20,
		});
	});
});

describe("WarehouseFacilityStatsRepository", () => {
	it("queries one facility with a bound parameter", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [RESERVATION_ROW] });

		const counts = await new WarehouseFacilityStatsRepository({ query }).getReservationStats([
			"889" as never,
		]);

		expect(query).toHaveBeenCalledWith(FACILITY_RESERVATION_STATS_SQL, [[889]]);
		expect(counts.playedLastWeek).toBe(55);
	});

	it("sums every member of a merged facility in one query", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [PLAYER_ROW] });

		await new WarehouseFacilityStatsRepository({ query }).getPlayerStats([
			"292" as never,
			"698" as never,
		]);

		expect(query).toHaveBeenCalledWith(FACILITY_PLAYER_STATS_SQL, [[292, 698]]);
	});

	it("fails loudly if the warehouse returns no row", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [] });
		await expect(
			new WarehouseFacilityStatsRepository({ query }).getReservationStats(["889" as never]),
		).rejects.toThrow("No reservation stats row returned for facility 889.");
		await expect(
			new WarehouseFacilityStatsRepository({ query }).getPlayerStats(["889" as never]),
		).rejects.toThrow("No player stats row returned for facility 889.");
	});
});

describe("facility game comparison batch", () => {
	it("reads both complete periods in one parameterized query", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [{ location_id: 889, played_last_28_days: "30", played_previous_28_days: "50" }],
		});
		const result = await new WarehouseFacilityStatsRepository({ query }).getGameComparisons([
			"889" as never,
		]);
		expect(result).toEqual([{ facilityId: "889", playedLast28Days: 30, playedPrevious28Days: 50 }]);
		expect(query).toHaveBeenCalledWith(expect.stringContaining("group by r.location_id"), [[889]]);
		expect(query.mock.calls[0]?.[0]).toContain("r.confirmed and r.status <> 'cancelled'");
		expect(query.mock.calls[0]?.[0]).toContain("r.date_with_time::date < b.this_week");
	});
});
