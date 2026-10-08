import { SampleMarketAudienceRepository } from "@server/infrastructure/repositories/sample/sample-market-audience-repository/sample-market-audience-repository";

const TODAY = "2026-10-08";

const repository = new SampleMarketAudienceRepository();

describe("SampleMarketAudienceRepository", () => {
	it("returns the same audience for the same market and day", async () => {
		expect(await repository.getAudience("2", TODAY)).toEqual(
			await repository.getAudience("2", TODAY),
		);
		expect(await repository.getAudience("2", TODAY)).not.toEqual(
			await repository.getAudience("2", "2026-10-09"),
		);
	});

	it("gives all markets a larger audience than one market", async () => {
		const all = await repository.getAudience(null, TODAY);
		const market = await repository.getAudience("2", TODAY);

		expect(all.week.activeUsers).toBeGreaterThan(market.week.activeUsers);
		expect(all.month.activeUsers).toBeGreaterThan(all.week.activeUsers);
		expect(all.month.registrations).toBeGreaterThan(all.week.registrations);
	});
});
