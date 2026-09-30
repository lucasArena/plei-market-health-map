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

describe("market game comparisons", () => {
	it("merges colocated facilities, retains stopped activity, and reconciles region totals", () => {
		const rows = toMarketGameChanges(
			[facility("1", "Houston", ["2"]), facility("3", "Houston"), facility("4", "Philadelphia")],
			[
				{ facilityId: asEntityId("1"), playedLast28Days: 20, playedPrevious28Days: 50 },
				{ facilityId: asEntityId("2"), playedLast28Days: 10, playedPrevious28Days: 20 },
				{ facilityId: asEntityId("3"), playedLast28Days: 0, playedPrevious28Days: 30 },
				{ facilityId: asEntityId("4"), playedLast28Days: 80, playedPrevious28Days: 40 },
			],
		);
		expect(rows[0]).toMatchObject({
			playedLast28Days: 30,
			playedPrevious28Days: 100,
			change: -70,
			changePercent: -70,
		});
		expect(rows[0]?.facilities).toMatchObject([
			{ playedLast28Days: 30, playedPrevious28Days: 70, change: -40 },
			{ change: -30, changePercent: -100 },
		]);
		expect(rows[1]).toMatchObject({ change: 40, changePercent: 100 });
		expect(rows.reduce((sum, row) => sum + row.change, 0)).toBe(-30);
	});
	it("marks zero baselines without inventing percent growth and handles absent locations", () => {
		expect(
			toMarketGameChanges(
				[facility("1", "Houston")],
				[{ facilityId: asEntityId("1"), playedLast28Days: 4, playedPrevious28Days: 0 }],
			)[0],
		).toMatchObject({ change: 4, changePercent: null });
		expect(toMarketGameChanges([facility("1", "Houston")], [])[0]).toMatchObject({
			change: 0,
			playedLast28Days: 0,
			changePercent: null,
		});
		expect(toMarketGameChanges([], [])).toEqual([]);
	});
});
