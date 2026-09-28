import { InMemoryMarketRepository } from "@application/testing/in-memory-market-repository";
import { makeListMarketHealth } from "@application/use-cases/list-market-health";
import { asEntityId, Market } from "@market-health-map/domain";

function market(id: string, healthScore: number) {
	return Market.create({
		id: asEntityId(id),
		name: `Market ${id}`,
		state: "TX",
		country: "USA",
		currency: "USD",
		location: { latitude: 30, longitude: -97 },
		metrics: { activePlayers: 10, gamesLastWeek: 5, facilities: 2, healthScore },
	});
}

describe("listMarketHealth", () => {
	it("returns markets with their status, weakest first", async () => {
		const listMarketHealth = makeListMarketHealth({
			markets: new InMemoryMarketRepository([market("a", 85), market("b", 20), market("c", 55)]),
		});

		const views = await listMarketHealth();

		expect(views.map((view) => [view.id, view.healthStatus])).toEqual([
			["b", "at-risk"],
			["c", "watch"],
			["a", "healthy"],
		]);
		expect(views[0]).toMatchObject({ name: "Market b", state: "TX" });
	});

	it("returns an empty list when there are no markets", async () => {
		const listMarketHealth = makeListMarketHealth({ markets: new InMemoryMarketRepository() });
		await expect(listMarketHealth()).resolves.toEqual([]);
	});
});
