import { FixedClock } from "@market-health-map/core/application/testing";
import { SampleFacilityStatsRepository } from "@server/infrastructure/repositories/sample/sample-facility-stats-repository/sample-facility-stats-repository";

const repository = new SampleFacilityStatsRepository(
	new FixedClock(new Date("2026-09-29T12:00:00Z")),
);

const TODAY = "2026-10-08";

describe("SampleFacilityStatsRepository", () => {
	it("produces consistent, deterministic counts over the full days ending yesterday", async () => {
		const ids = ["austin-facility-1" as never];
		const first = await repository.getReservationStats(ids, TODAY);
		const second = await repository.getReservationStats(ids, TODAY);
		const firstPlayers = await repository.getPlayerStats(ids, TODAY);
		const secondPlayers = await repository.getPlayerStats(ids, TODAY);

		expect(second).toEqual(first);
		expect(secondPlayers).toEqual(firstPlayers);
		expect(first.weekStart).toBe("2026-10-01");
		expect(first.periodStart).toBe("2026-09-10");
		expect(first.periodEnd).toBe("2026-10-07");
		expect(first.lastPlayedDate).toBe("2026-10-07");
		expect(first.playedLastWeek + first.cancelledLastWeek).toBe(first.scheduledLastWeek);
		expect(first.scheduledLastWeek).toBeGreaterThanOrEqual(4);
	});
});

describe("sample weekly activity", () => {
	it("shows the eight 7 day blocks ending yesterday and leaves out today", async () => {
		const ids = ["austin-facility-1" as never];

		const onThursday = await repository.getReservationStats(ids, TODAY);
		const onFriday = await repository.getReservationStats(ids, "2026-10-09");

		expect(onThursday.weeklyActivity.map((week) => week.weekStart)).toEqual([
			"2026-08-13",
			"2026-08-20",
			"2026-08-27",
			"2026-09-03",
			"2026-09-10",
			"2026-09-17",
			"2026-09-24",
			"2026-10-01",
		]);
		expect(onFriday.weeklyActivity.map((week) => week.weekStart)).toEqual([
			"2026-08-14",
			"2026-08-21",
			"2026-08-28",
			"2026-09-04",
			"2026-09-11",
			"2026-09-18",
			"2026-09-25",
			"2026-10-02",
		]);
	});
});

describe("sample game comparisons", () => {
	it("returns both period counts per facility", async () => {
		const ids = ["austin-facility-1" as never];
		const comparisons = await repository.getGameComparisons(ids, TODAY);
		const stats = await repository.getReservationStats(ids, TODAY);
		expect(comparisons).toEqual([
			{
				facilityId: ids[0],
				playedLastWeek: stats.playedLastWeek,
				playedPreviousWeek: stats.playedPreviousWeek,
				playedLast28Days: stats.playedLast28Days,
				playedPrevious28Days: stats.playedPrevious28Days,
			},
		]);
	});
});

it("reconciles sample market totals to facility contributions", async () => {
	const ids = ["one" as never, "two" as never];
	const comparisons = await repository.getGameComparisons(ids, TODAY);
	const stats = await repository.getReservationStats(ids, TODAY);
	expect(stats.playedLast28Days).toBe(
		comparisons.reduce((sum, row) => sum + row.playedLast28Days, 0),
	);
	expect(stats.playedPrevious28Days).toBe(
		comparisons.reduce((sum, row) => sum + row.playedPrevious28Days, 0),
	);
	expect((await repository.getReservationStats([], TODAY)).playedLast28Days).toBe(0);
});

describe("sample weekly activated players", () => {
	it("splits the activated counts into the eight 7 day blocks ending yesterday", async () => {
		const ids = ["one" as never, "two" as never];
		const stats = await repository.getPlayerStats(ids, TODAY);
		const members = await Promise.all(ids.map((id) => repository.getPlayerStats([id], TODAY)));
		const players = stats.weeklyActivatedPlayers.map((week) => week.players);
		const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

		expect(stats.weeklyActivatedPlayers.map((week) => week.weekStart)).toEqual([
			"2026-08-13",
			"2026-08-20",
			"2026-08-27",
			"2026-09-03",
			"2026-09-10",
			"2026-09-17",
			"2026-09-24",
			"2026-10-01",
		]);
		expect(players.at(-1)).toBe(stats.activatedPlayersLastWeek);
		expect(players.at(-2)).toBe(stats.activatedPlayersPreviousWeek);
		expect(sum(players.slice(4))).toBe(stats.activatedPlayersLast28Days);
		expect(sum(players.slice(0, 4))).toBe(stats.activatedPlayersPrevious28Days);
		expect(stats.activatedPlayersLast28Days).toBe(
			sum(members.map((member) => member.activatedPlayersLast28Days)),
		);
		expect(players).toEqual(
			players.map((_, index) =>
				sum(members.map((member) => member.weeklyActivatedPlayers[index]?.players ?? 0)),
			),
		);
	});
});
