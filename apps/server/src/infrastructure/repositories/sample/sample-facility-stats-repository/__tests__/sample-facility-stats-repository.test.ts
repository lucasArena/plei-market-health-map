import { FixedClock } from "@market-health-map/core/application/testing";
import { SampleFacilityStatsRepository } from "@server/infrastructure/repositories/sample/sample-facility-stats-repository/sample-facility-stats-repository";

const repository = new SampleFacilityStatsRepository(
	new FixedClock(new Date("2026-09-29T12:00:00Z")),
);

describe("SampleFacilityStatsRepository", () => {
	it("produces consistent, deterministic weekly counts", async () => {
		const ids = ["austin-facility-1" as never];
		const first = await repository.getReservationStats(ids);
		const second = await repository.getReservationStats(ids);
		const firstPlayers = await repository.getPlayerStats(ids);
		const secondPlayers = await repository.getPlayerStats(ids);

		expect(second).toEqual(first);
		expect(secondPlayers).toEqual(firstPlayers);
		expect(first.weekStart).toBe("2026-09-21");
		expect(first.lastPlayedDate).toBe("2026-09-28");
		expect(first.playedLastWeek + first.cancelledLastWeek).toBe(first.scheduledLastWeek);
		expect(first.scheduledLastWeek).toBeGreaterThanOrEqual(4);
	});
});

describe("sample weekly activity", () => {
	it("shows four completed Monday to Sunday weeks and leaves out the current week", async () => {
		const sunday = new SampleFacilityStatsRepository(
			new FixedClock(new Date("2026-09-27T23:00:00Z")),
		);
		const monday = new SampleFacilityStatsRepository(
			new FixedClock(new Date("2026-09-28T00:00:00Z")),
		);
		const ids = ["austin-facility-1" as never];

		const onSunday = await sunday.getReservationStats(ids);
		const onMonday = await monday.getReservationStats(ids);

		expect(onSunday.weeklyActivity.map((week) => week.weekStart)).toEqual([
			"2026-08-24",
			"2026-08-31",
			"2026-09-07",
			"2026-09-14",
		]);
		expect(onMonday.weeklyActivity.map((week) => week.weekStart)).toEqual([
			"2026-08-31",
			"2026-09-07",
			"2026-09-14",
			"2026-09-21",
		]);
	});
});

describe("sample game comparisons", () => {
	it("returns both period counts per facility", async () => {
		const ids = ["austin-facility-1" as never];
		const comparisons = await repository.getGameComparisons(ids);
		const stats = await repository.getReservationStats(ids);
		expect(comparisons).toEqual([
			{
				facilityId: ids[0],
				playedLast28Days: stats.playedLast28Days,
				playedPrevious28Days: stats.playedPrevious28Days,
			},
		]);
	});
});

it("reconciles sample market totals to facility contributions", async () => {
	const ids = ["one" as never, "two" as never];
	const comparisons = await repository.getGameComparisons(ids);
	const stats = await repository.getReservationStats(ids);
	expect(stats.playedLast28Days).toBe(
		comparisons.reduce((sum, row) => sum + row.playedLast28Days, 0),
	);
	expect(stats.playedPrevious28Days).toBe(
		comparisons.reduce((sum, row) => sum + row.playedPrevious28Days, 0),
	);
	expect((await repository.getReservationStats([])).playedLast28Days).toBe(0);
});
