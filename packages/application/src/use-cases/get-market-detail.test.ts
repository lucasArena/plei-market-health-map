import { NotFoundError } from "@application/errors/use-case-error";
import { InMemoryFacilityRepository } from "@application/testing/in-memory-facility-repository";
import { InMemoryMarketRepository } from "@application/testing/in-memory-market-repository";
import { makeGetMarketDetail } from "@application/use-cases/get-market-detail";
import { asEntityId, Facility, Market } from "@market-health-map/domain";

const AUSTIN = asEntityId("austin");
const DALLAS = asEntityId("dallas");

function market(id: typeof AUSTIN) {
	return Market.create({
		id,
		name: "Austin",
		state: "TX",
		country: "USA",
		currency: "USD",
		location: { latitude: 30.27, longitude: -97.74 },
		metrics: { activePlayers: 100, gamesLastWeek: 40, facilities: 2, healthScore: 80 },
	});
}

function facility(id: string, marketId: typeof AUSTIN, gamesLastWeek: number) {
	return Facility.create({
		id: asEntityId(id),
		marketId,
		name: `Facility ${id}`,
		address: "1 Main St",
		avatarUrl: null,
		metrics: { activePlayers: 50, gamesLastWeek, utilization: 60 },
	});
}

function setup() {
	return makeGetMarketDetail({
		markets: new InMemoryMarketRepository([market(AUSTIN)]),
		facilities: new InMemoryFacilityRepository([
			facility("quiet", AUSTIN, 5),
			facility("busy", AUSTIN, 30),
			facility("elsewhere", DALLAS, 99),
		]),
	});
}

describe("getMarketDetail", () => {
	it("returns the market with its facilities, busiest first", async () => {
		const detail = await setup()({ marketId: " austin " });

		expect(detail.market).toMatchObject({ id: "austin", healthStatus: "healthy" });
		expect(detail.facilities.map((item) => item.id)).toEqual(["busy", "quiet"]);
		expect(detail.facilities[0]).toMatchObject({ name: "Facility busy", avatarUrl: null });
	});

	it("throws when the market does not exist", async () => {
		await expect(setup()({ marketId: "nowhere" })).rejects.toBeInstanceOf(NotFoundError);
	});

	it("rejects a blank market id", async () => {
		await expect(setup()({ marketId: " " })).rejects.toThrow();
	});
});
