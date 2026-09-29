import { Market } from "@market-health-map/core/domain";
import { PLEI_REGIONS } from "@server/infrastructure/sample/plei-regions";
import { SAMPLE_MARKETS, toSampleMarket } from "@server/infrastructure/sample/sample-markets";

const INTERNAL_REGION_PATTERN = /automation|pipeline|test|lucas|l2m|m2m/i;

describe("PLEI_REGIONS", () => {
	it("contains only real markets, with unique slugs", () => {
		expect(PLEI_REGIONS.some((region) => INTERNAL_REGION_PATTERN.test(region.name))).toBe(false);
		expect(new Set(PLEI_REGIONS.map((region) => region.slug)).size).toBe(PLEI_REGIONS.length);
	});
});

describe("toSampleMarket", () => {
	it("keeps the catalog facts and builds valid markets", () => {
		expect(SAMPLE_MARKETS).toHaveLength(PLEI_REGIONS.length);
		for (const props of SAMPLE_MARKETS) expect(() => Market.create(props)).not.toThrow();
		expect(SAMPLE_MARKETS.find((market) => market.id === "houston")).toMatchObject({
			name: "Houston",
			state: "Texas",
			country: "USA",
			currency: "USD",
			metrics: { facilities: 110 },
		});
	});

	it("gives regions without facilities no activity", () => {
		const region = PLEI_REGIONS.find((item) => item.slug === "las-vegas");
		if (!region) throw new Error("Las Vegas missing");
		expect(toSampleMarket(region).metrics).toEqual({
			facilities: 0,
			activePlayers: 0,
			gamesLastWeek: 0,
			healthScore: 0,
		});
	});
});
