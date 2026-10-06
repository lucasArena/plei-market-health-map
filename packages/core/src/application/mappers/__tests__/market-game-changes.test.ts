import { toMarketGameChanges } from "@core/application/mappers/market-game-changes";
import { asEntityId, Facility } from "@core/domain";

function facility(id: string, market: string, members: string[] = []) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId(market),
		marketName: market,
		name: `Facility ${id}`,
		address: "1 Main St",
		location: { latitude: 30, longitude: -90 },
		avatarUrl: null,
		memberIds: members.map(asEntityId),
		metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 0, utilization: 0 },
	});
}

function comparison(id: string, playedLast28Days: number, playedPrevious28Days: number) {
	return {
		facilityId: asEntityId(id),
		playedLastWeek: 0,
		playedPreviousWeek: 0,
		playedLast28Days,
		playedPrevious28Days,
	};
}

describe("market game comparisons", () => {
	it("merges colocated facilities, retains stopped activity, and reconciles region totals", () => {
		const rows = toMarketGameChanges(
			[facility("1", "Houston", ["2"]), facility("3", "Houston"), facility("4", "Philadelphia")],
			[
				comparison("1", 20, 50),
				comparison("2", 10, 20),
				comparison("3", 0, 30),
				comparison("4", 80, 40),
			],
			"month",
		);
		expect(rows[0]).toMatchObject({
			played: 30,
			playedPrevious: 100,
			change: -70,
			changePercent: -70,
		});
		expect(rows[0]?.facilities).toMatchObject([
			{ played: 30, playedPrevious: 70, change: -40 },
			{ change: -30, changePercent: -100 },
		]);
		expect(rows[1]).toMatchObject({ change: 40, changePercent: 100 });
		expect(rows.reduce((sum, row) => sum + row.change, 0)).toBe(-30);
	});
	it("marks zero baselines without inventing percent growth and handles absent locations", () => {
		expect(
			toMarketGameChanges([facility("1", "Houston")], [comparison("1", 4, 0)], "month")[0],
		).toMatchObject({ change: 4, changePercent: null });
		expect(toMarketGameChanges([facility("1", "Houston")], [], "week")[0]).toMatchObject({
			change: 0,
			played: 0,
			changePercent: null,
		});
		expect(toMarketGameChanges([], [], "month")).toEqual([]);
	});
	it("compares the last completed week with the week before when asked for the week", () => {
		const [houston] = toMarketGameChanges(
			[facility("1", "Houston")],
			[{ ...comparison("1", 40, 20), playedLastWeek: 9, playedPreviousWeek: 12 }],
			"week",
		);

		expect(houston).toMatchObject({
			played: 9,
			playedPrevious: 12,
			change: -3,
			changePercent: -25,
		});
	});
});
