import { FixtureRegistrationHeatmapRepository } from "@server/infrastructure/repositories/sample/fixture-registration-heatmap-repository/fixture-registration-heatmap-repository";

describe("FixtureRegistrationHeatmapRepository", () => {
	it("returns independent copies of the sample registration cells", async () => {
		const repository = new FixtureRegistrationHeatmapRepository();

		const first = await repository.listLast28Days();
		const second = await repository.listLast28Days();

		expect(first).toHaveLength(6);
		expect(first[0]).toEqual({ lat: 29.76, lng: -95.37, registrationWeight: 72 });
		expect(first).not.toBe(second);
	});
});
