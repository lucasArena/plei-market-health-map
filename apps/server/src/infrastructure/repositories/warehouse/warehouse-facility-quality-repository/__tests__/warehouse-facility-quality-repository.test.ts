import {
	FACILITY_QUALITY_SQL,
	QUALITY_WINDOWS,
	toFacilityQuality,
	WarehouseFacilityQualityRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-facility-quality-repository/warehouse-facility-quality-repository";
import { metricDrillDownQualityPopulationSql } from "@server/infrastructure/repositories/warehouse/warehouse-metric-drill-down-repository/warehouse-metric-drill-down-sql";

const TODAY = "2026-10-09";

const COUNTS = {
	played_games: "57",
	roster_games: "57",
	roster_players: "681",
	waitlist_games: "30",
	rostered_cancelled_games: "27",
	almost_filled_games: "0",
	incident_games: "4",
	rating_count: "64",
	rating_total: "287",
	players: "433",
	returning_players: "191",
};

const ROW = {
	...Object.fromEntries(
		QUALITY_WINDOWS.flatMap((window, index) =>
			Object.entries(COUNTS).map(([name, value]) => [
				`${name}_${window.name}`,
				String(Number(value) + index),
			]),
		),
	),
	rating_total_previous_28_days: null,
	low_reviews: [
		{ id: 269678, rate: "1", date: "2026-10-07", title: "Issues with other players" },
		{ id: "269352", rate: 2, date: "2026-10-06", title: null },
	],
} as never;

describe("facility quality SQL", () => {
	it("reuses the drill-down quality population over both 28 day windows", () => {
		expect(FACILITY_QUALITY_SQL.startsWith(metricDrillDownQualityPopulationSql(56, false))).toBe(
			true,
		);
		expect(FACILITY_QUALITY_SQL).toContain("r.location_id = any($1::int[])");
		expect(FACILITY_QUALITY_SQL).toContain("select $2::date as today");
		expect(FACILITY_QUALITY_SQL).not.toContain("current_date");
		expect(FACILITY_QUALITY_SQL).not.toContain("now()");
		expect(FACILITY_QUALITY_SQL).not.toContain("$3");
	});

	it("compares the full days ending yesterday with the window before", () => {
		expect(FACILITY_QUALITY_SQL).toContain(
			"filter (where c.happened and c.game_date >= b.today - 7 and c.game_date < b.today) as played_games_last_week",
		);
		expect(FACILITY_QUALITY_SQL).toContain(
			"filter (where c.happened and c.game_date >= b.today - 56 and c.game_date < b.today - 28) as played_games_previous_28_days",
		);
		expect(FACILITY_QUALITY_SQL).toContain(
			"filter (where c.almost_filled and c.game_date >= b.today - 28 and c.game_date < b.today) as almost_filled_games_last_28_days",
		);
		expect(FACILITY_QUALITY_SQL).toContain(
			"filter (where c.rostered_canceled and c.game_date >= b.today - 14 and c.game_date < b.today - 7) as rostered_cancelled_games_previous_week",
		);
	});

	it("averages the real player count of played games from active payouts", () => {
		expect(FACILITY_QUALITY_SQL).toContain("max(p.real_player_count) as real_player_count");
		expect(FACILITY_QUALITY_SQL).toContain("where p.deleted_at is null");
		expect(FACILITY_QUALITY_SQL).not.toContain("plei_player_count");
		expect(FACILITY_QUALITY_SQL).not.toContain("players_count");
		expect(FACILITY_QUALITY_SQL).toContain(
			"coalesce(sum(pr.real_player_count) filter (where c.happened and c.game_date >= b.today - 7 and c.game_date < b.today), 0) as roster_players_last_week",
		);
	});

	it("counts played games with at least one waitlist join", () => {
		expect(FACILITY_QUALITY_SQL).toContain("select distinct w.reservation_id");
		expect(FACILITY_QUALITY_SQL).toContain("from plei_gold.fct_waitlist w");
		expect(FACILITY_QUALITY_SQL).toContain("c.happened and wg.reservation_id is not null");
		expect(FACILITY_QUALITY_SQL).not.toContain("vw_waitlist2");
		expect(FACILITY_QUALITY_SQL).not.toContain("waitlist_date");
	});

	it("rates reviews of played games and lists the latest low ones without hidden text", () => {
		expect(FACILITY_QUALITY_SQL).toContain(
			"join classified c on c.reservation_id = v.reservation_id and c.happened",
		);
		expect(FACILITY_QUALITY_SQL).toContain(
			"coalesce(sum(gr.rate) filter (where gr.game_date >= b.today - 28 and gr.game_date < b.today), 0) as rating_total_last_28_days",
		);
		expect(FACILITY_QUALITY_SQL).toContain("where gr.rate < 3");
		expect(FACILITY_QUALITY_SQL).toContain("order by gr.created_at desc, gr.review_id desc");
		expect(FACILITY_QUALITY_SQL).toContain("limit 5");
		expect(FACILITY_QUALITY_SQL).toContain("nullif(btrim(gr.title_message), '') as title");
		expect(FACILITY_QUALITY_SQL).not.toContain("body_message");
	});

	it("finds returning players among qualifying plays one window further back", () => {
		expect(FACILITY_QUALITY_SQL).toContain("f.date_played >= b.today - 84");
		expect(FACILITY_QUALITY_SQL).toContain("f.valid_player + 0 = 1");
		expect(FACILITY_QUALITY_SQL).toContain("f.players_type || '' = 'pleiapp_player'");
		expect(FACILITY_QUALITY_SQL).toContain("p.confirmed_at is not null");
		expect(FACILITY_QUALITY_SQL).toContain(
			"bool_or(f.date_played >= b.today - 84 and f.date_played < b.today - 56) as played_28_2",
		);
		expect(FACILITY_QUALITY_SQL).toContain(
			"count(*) filter (where pw.played_28_1 and pw.played_28_2) as returning_players_previous_28_days",
		);
		expect(FACILITY_QUALITY_SQL).toContain(
			"count(*) filter (where pw.played_7_0) as players_last_week",
		);
	});
});

describe("toFacilityQuality", () => {
	it("maps each window and the low reviews", () => {
		const quality = toFacilityQuality(ROW);

		expect(quality.periods.week.current).toEqual({
			playedGames: 57,
			rosterGames: 57,
			rosterPlayers: 681,
			waitlistGames: 30,
			rosteredCancelledGames: 27,
			almostFilledGames: 0,
			incidentGames: 4,
			ratingCount: 64,
			ratingTotal: 287,
			players: 433,
			returningPlayers: 191,
		});
		expect(quality.periods.week.previous.playedGames).toBe(58);
		expect(quality.periods.month.current.playedGames).toBe(59);
		expect(quality.periods.month.previous).toMatchObject({ playedGames: 60, ratingTotal: 0 });
		expect(quality.lowReviews).toEqual([
			{ id: "269678", rate: 1, date: "2026-10-07", title: "Issues with other players" },
			{ id: "269352", rate: 2, date: "2026-10-06", title: null },
		]);
	});

	it("returns no low reviews when the facility has none", () => {
		expect(
			toFacilityQuality({ ...(ROW as object), low_reviews: null } as never).lowReviews,
		).toEqual([]);
	});
});

describe("WarehouseFacilityQualityRepository", () => {
	it("binds the merged facility ids and the viewer's day", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [ROW] });
		const repository = new WarehouseFacilityQualityRepository({ query });

		const quality = await repository.getQuality(["889", "963"] as never, TODAY);

		expect(query).toHaveBeenCalledWith(FACILITY_QUALITY_SQL, [[889, 963], TODAY]);
		expect(quality.periods.week.current.playedGames).toBe(57);
	});

	it("fails loudly when the warehouse returns no row", async () => {
		const repository = new WarehouseFacilityQualityRepository({
			query: vi.fn().mockResolvedValue({ rows: [] }),
		});

		await expect(repository.getQuality(["889"] as never, TODAY)).rejects.toThrow(
			"No quality row returned for facility 889.",
		);
	});
});
