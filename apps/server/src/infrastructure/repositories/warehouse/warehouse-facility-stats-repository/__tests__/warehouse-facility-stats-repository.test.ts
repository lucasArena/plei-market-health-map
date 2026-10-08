import {
	FACILITY_PLAYER_STATS_SQL,
	FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL,
	FACILITY_RESERVATION_STATS_SQL,
	toPlayerStats,
	toReservationStats,
	WarehouseFacilityStatsRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-stats-repository/warehouse-facility-stats-repository";

/** The viewer's local today; every window ends the day before. */
const TODAY = "2026-10-08";

const RESERVATION_ROW = {
	period_start: "2026-09-03",
	period_end: "2026-09-30",
	week_start: "2026-09-21",
	played_last_week: "55",
	played_previous_week: "51",
	played_last_28_days: "212",
	played_previous_28_days: "200",
	scheduled_last_28_days: "250",
	scheduled_previous_28_days: "240",
	scheduled_last_week: "87",
	scheduled_previous_week: "87",
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
	unique_players_last_week: "30",
	unique_players_previous_week: "25",
	activated_players_last_week: "6",
	activated_players_previous_week: "5",
};

describe("facility stats SQL", () => {
	it("filters every reservation scan by department only in the department variant", () => {
		const departmentFilter = "else 'partnerships' end = any($3::text[])";
		expect(FACILITY_RESERVATION_STATS_SQL).not.toContain("organizer_partners");
		expect(FACILITY_RESERVATION_STATS_SQL).not.toContain("$3");
		expect(FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL).toContain("organizer_partners as (");
		expect(FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL.split(departmentFilter)).toHaveLength(3);
		expect(
			FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL.match(
				/left join organizer_partners op on op.partner_id = r.partner_id/g,
			),
		).toHaveLength(2);
	});

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

	it("reads today from the viewer's bound date, never the session clock", () => {
		for (const sql of [
			FACILITY_RESERVATION_STATS_SQL,
			FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL,
			FACILITY_PLAYER_STATS_SQL,
		]) {
			expect(sql).toContain("select $2::date as today");
			expect(sql).not.toContain("current_date");
			expect(sql).not.toContain("now()");
			expect(sql).not.toContain("date_trunc('week'");
		}
	});

	it("buckets weekly activity into the four 7 day blocks ending yesterday", () => {
		// Each block is 7 full days, so the last block is the 7D window and all four make the 28D one.
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"g.game_date >= w.week_start and g.game_date < w.week_start + 7",
		);
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"generate_series(b.today - 28, b.today - 7, interval '7 days')",
		);
	});

	it("uses the 7 full days ending yesterday for 7D, never today", () => {
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("(b.today - 7)::text as week_start");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"g.game_date >= b.today - 7 and g.game_date < b.today",
		);
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"g.game_date >= b.today - 14 and g.game_date < b.today - 7",
		);
	});

	it("queries weekly and 28-day player analytics in one bounded scan", () => {
		expect(FACILITY_PLAYER_STATS_SQL).toContain("plei_gold.fct_games_opened");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("p.players_type = 'pleiapp_player'");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("f.confirmed_game + 0 = 1");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("f.players_type || '' = 'pleiapp_player'");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("player_lifecycle = 'Activated'");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("f.date_played >= $2::date - 56");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("f.date_played < $2::date");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("b.today - 28");
		expect(FACILITY_PLAYER_STATS_SQL).toContain("group by b.today");
		expect(FACILITY_PLAYER_STATS_SQL).toContain(
			"date_played >= b.today - 7 and date_played < b.today",
		);
		expect(FACILITY_PLAYER_STATS_SQL).toContain(
			"date_played >= b.today - 14 and date_played < b.today - 7",
		);
		expect(FACILITY_PLAYER_STATS_SQL).toContain("exists (");
		expect(FACILITY_PLAYER_STATS_SQL).not.toContain("dim_reservation");
	});

	it("uses rolling completed-day windows outside the weekly chart", () => {
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"g.game_date >= b.today - 28 and g.game_date < b.today",
		);
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"g.game_date >= b.today - 56 and g.game_date < b.today - 28",
		);
	});

	it("buckets popular times into the mobile app's local day parts", () => {
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("r.date_with_time as game_time");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("between 7 and 11 then 0");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("between 12 and 16 then 1");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("between 17 and 21 then 2");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain("else 3");
		expect(FACILITY_RESERVATION_STATS_SQL).toContain(
			"extract(isodow from g.game_time - interval '7 hours')::int = t.day_of_week",
		);
		expect(FACILITY_RESERVATION_STATS_SQL.match(/interval '7 hours'/g)).toHaveLength(1);
	});
});

describe("warehouse facility stats mappers", () => {
	it("converts warehouse strings to numbers", () => {
		expect(toReservationStats(RESERVATION_ROW)).toEqual({
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
			uniquePlayersLastWeek: 30,
			uniquePlayersPreviousWeek: 25,
			activatedPlayersLastWeek: 6,
			activatedPlayersPreviousWeek: 5,
		});
	});
});

describe("WarehouseFacilityStatsRepository", () => {
	it("counts only the selected departments' games, with today as $2 and the departments as $3", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [RESERVATION_ROW] });
		const repository = new WarehouseFacilityStatsRepository({ query });

		await repository.getReservationStats(["889" as never], TODAY, {
			departments: ["organizers", "magic"],
		});
		await repository.getReservationStats(["889" as never], TODAY, { departments: [] });

		expect(query).toHaveBeenNthCalledWith(1, FACILITY_RESERVATION_STATS_BY_DEPARTMENT_SQL, [
			[889],
			TODAY,
			["magic", "organizers"],
		]);
		expect(query).toHaveBeenNthCalledWith(2, FACILITY_RESERVATION_STATS_SQL, [[889], TODAY]);
	});

	it("queries one facility with a bound parameter", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [RESERVATION_ROW] });

		const counts = await new WarehouseFacilityStatsRepository({ query }).getReservationStats(
			["889" as never],
			TODAY,
		);

		expect(query).toHaveBeenCalledWith(FACILITY_RESERVATION_STATS_SQL, [[889], TODAY]);
		expect(counts.playedLastWeek).toBe(55);
	});

	it("sums every member of a merged facility in one query", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [PLAYER_ROW] });

		await new WarehouseFacilityStatsRepository({ query }).getPlayerStats(
			["292" as never, "698" as never],
			TODAY,
		);

		expect(query).toHaveBeenCalledWith(FACILITY_PLAYER_STATS_SQL, [[292, 698], TODAY]);
	});

	it("fails loudly if the warehouse returns no row", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [] });
		await expect(
			new WarehouseFacilityStatsRepository({ query }).getReservationStats(["889" as never], TODAY),
		).rejects.toThrow("No reservation stats row returned for facility 889.");
		await expect(
			new WarehouseFacilityStatsRepository({ query }).getPlayerStats(["889" as never], TODAY),
		).rejects.toThrow("No player stats row returned for facility 889.");
	});
});

describe("facility game comparison batch", () => {
	it("reads the weekly and 28-day periods in one parameterized query", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [
				{
					location_id: 889,
					played_last_week: "7",
					played_previous_week: "9",
					played_last_28_days: "30",
					played_previous_28_days: "50",
				},
			],
		});
		const result = await new WarehouseFacilityStatsRepository({ query }).getGameComparisons(
			["889" as never],
			TODAY,
		);
		expect(result).toEqual([
			{
				facilityId: "889",
				playedLastWeek: 7,
				playedPreviousWeek: 9,
				playedLast28Days: 30,
				playedPrevious28Days: 50,
			},
		]);
		const sql = query.mock.calls[0]?.[0] as string;
		expect(query).toHaveBeenCalledWith(expect.stringContaining("group by r.location_id"), [
			[889],
			TODAY,
		]);
		expect(sql).toContain("select $2::date as today");
		expect(sql).toContain(
			"r.date_with_time::date >= b.today - 7 and r.date_with_time::date < b.today",
		);
		expect(sql).toContain(
			"r.date_with_time::date >= b.today - 14 and r.date_with_time::date < b.today - 7",
		);
		expect(sql).toContain("r.date_with_time::date >= b.today - 56");
		expect(sql).toContain("r.confirmed and r.status <> 'cancelled'");
		expect(sql).not.toContain("now()");
		expect(sql).not.toContain("current_date");
	});
});
