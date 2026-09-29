import {
	FACILITY_WEEKLY_STATS_SQL,
	toWeeklyCounts,
	WarehouseFacilityStatsRepository,
} from "@infra/warehouse/warehouse-facility-stats-repository";

const ROW = {
	week_start: "2026-09-21",
	played_last_week: "55",
	played_previous_week: "51",
	played_last_28_days: "212",
	scheduled_last_week: "87",
	cancelled_last_week: "32",
	upcoming_next_seven_days: "41",
	last_played_date: "2026-09-28",
};

describe("FACILITY_WEEKLY_STATS_SQL", () => {
	it("follows the catalog's pickup, played and operational-cancellation rules", () => {
		expect(FACILITY_WEEKLY_STATS_SQL).toContain("r.reservation_type = 'OpenReservation'");
		expect(FACILITY_WEEKLY_STATS_SQL).toContain(
			"r.cancellation_reason in ('Recurring game series', 'Operational changes')",
		);
		expect(FACILITY_WEEKLY_STATS_SQL).toContain("g.confirmed and g.status <> 'cancelled'");
		expect(FACILITY_WEEKLY_STATS_SQL).toContain("date_trunc('week', current_date)");
		expect(FACILITY_WEEKLY_STATS_SQL).toContain("where r.location_id = any($1::int[])");
	});
});

describe("toWeeklyCounts", () => {
	it("converts warehouse strings to numbers", () => {
		expect(toWeeklyCounts(ROW)).toEqual({
			weekStart: "2026-09-21",
			playedLastWeek: 55,
			playedPreviousWeek: 51,
			playedLast28Days: 212,
			scheduledLastWeek: 87,
			cancelledLastWeek: 32,
			upcomingNextSevenDays: 41,
			lastPlayedDate: "2026-09-28",
		});
	});
});

describe("WarehouseFacilityStatsRepository", () => {
	it("queries one facility with a bound parameter", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [ROW] });

		const counts = await new WarehouseFacilityStatsRepository({ query }).getWeeklyCounts([
			"889" as never,
		]);

		expect(query).toHaveBeenCalledWith(FACILITY_WEEKLY_STATS_SQL, [[889]]);
		expect(counts.playedLastWeek).toBe(55);
	});

	it("sums every member of a merged facility in one query", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [ROW] });

		await new WarehouseFacilityStatsRepository({ query }).getWeeklyCounts([
			"292" as never,
			"698" as never,
		]);

		expect(query).toHaveBeenCalledWith(FACILITY_WEEKLY_STATS_SQL, [[292, 698]]);
	});

	it("fails loudly if the warehouse returns no row", async () => {
		const query = vi.fn().mockResolvedValue({ rows: [] });
		await expect(
			new WarehouseFacilityStatsRepository({ query }).getWeeklyCounts(["889" as never]),
		).rejects.toThrow("No stats row returned for facility 889.");
	});
});
