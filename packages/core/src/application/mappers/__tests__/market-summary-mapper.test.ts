import {
	MARKET_SUMMARY_RANK_LIMIT,
	toMarketMemberIds,
	toTopFacilities,
	toTopMarkets,
} from "@core/application/mappers/market-summary-mapper";
import { asEntityId, Facility } from "@core/domain";

function facility(id: string, marketId: string, gamesLast28Days: number, name = `Facility ${id}`) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId(marketId),
		name,
		address: "1 Main St",
		location: { latitude: 39.96, longitude: -75.15 },
		avatarUrl: null,
		memberIds: [asEntityId(id), asEntityId("shared")],
		metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days, utilization: 0 },
	});
}

describe("market summary mapper", () => {
	it("lists each member id once across merged facilities", () => {
		expect(toMarketMemberIds([facility("1", "a", 1), facility("2", "a", 1)])).toEqual([
			"1",
			"shared",
			"2",
		]);
	});

	it("ranks facilities by games, then by name, and caps the list", () => {
		const facilities = [
			facility("1", "a", 5, "Beta"),
			facility("2", "a", 5, "Alpha"),
			facility("3", "a", 9),
			...Array.from({ length: 6 }, (_, index) => facility(`x${index}`, "b", 1)),
		];

		const ranked = toTopFacilities(facilities, "month");

		expect(ranked).toHaveLength(MARKET_SUMMARY_RANK_LIMIT);
		expect(ranked.slice(0, 3).map((rank) => rank.name)).toEqual(["Facility 3", "Alpha", "Beta"]);
		expect(ranked[0]).toEqual({
			id: "3",
			name: "Facility 3",
			marketName: "a",
			games: 9,
		});
	});

	it("ranks markets by summed games and skips markets without activity", () => {
		const ranked = toTopMarkets(
			[facility("1", "a", 2), facility("2", "b", 3), facility("3", "a", 4), facility("4", "c", 0)],
			"month",
			2,
		);

		expect(ranked.map((rank) => [rank.id, rank.games])).toEqual([
			["a", 6],
			["b", 3],
		]);
	});
});
