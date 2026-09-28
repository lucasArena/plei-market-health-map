import { SampleMarketRepository } from "@infra/sample/sample-market-repository";
import { SAMPLE_MARKETS } from "@infra/sample/sample-markets";
import { asEntityId } from "@market-health-map/domain";

describe("SampleMarketRepository", () => {
	it("serves every sample market as a valid entity", async () => {
		const markets = await new SampleMarketRepository().listActive();

		expect(markets).toHaveLength(SAMPLE_MARKETS.length);
		expect(new Set(markets.map((market) => market.healthStatus))).toEqual(
			new Set(["healthy", "watch", "at-risk", "inactive"]),
		);
	});

	it("accepts injected markets", async () => {
		const [first] = SAMPLE_MARKETS;
		const markets = await new SampleMarketRepository(first ? [first] : []).listActive();
		expect(markets).toHaveLength(1);
	});

	it("finds a market by id", async () => {
		const repository = new SampleMarketRepository();
		expect((await repository.findById(asEntityId("austin")))?.toJSON().name).toBe("Austin");
		expect(await repository.findById(asEntityId("missing"))).toBeNull();
	});
});
