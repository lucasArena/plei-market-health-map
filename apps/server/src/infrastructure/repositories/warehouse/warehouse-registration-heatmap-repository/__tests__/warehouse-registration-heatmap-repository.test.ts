import {
	REGISTRATION_HEATMAP_LAST_28D_SQL,
	toRegistrationHeatmapCell,
	WarehouseRegistrationHeatmapRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-registration-heatmap-repository/warehouse-registration-heatmap-repository";

describe("WarehouseRegistrationHeatmapRepository", () => {
	it("maps valid aggregate rows and ignores invalid rows", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [
				{ lat: "29.746", lng: "-95.352", registration_weight: "42" },
				{ lat: null, lng: "-95.352", registration_weight: "10" },
				{ lat: "bad", lng: "-95.352", registration_weight: "10" },
				{ lat: "29.746", lng: "-95.352", registration_weight: "0" },
			],
		});
		const repository = new WarehouseRegistrationHeatmapRepository({ query });

		await expect(repository.listLast28Days()).resolves.toEqual([
			{ lat: 29.746, lng: -95.352, registrationWeight: 42 },
		]);
		expect(query).toHaveBeenCalledWith(REGISTRATION_HEATMAP_LAST_28D_SQL);
		expect(REGISTRATION_HEATMAP_LAST_28D_SQL).toContain("CURRENT_DATE - 28");
		expect(REGISTRATION_HEATMAP_LAST_28D_SQL).toContain("COUNT(DISTINCT player_id)");
		expect(REGISTRATION_HEATMAP_LAST_28D_SQL).toContain("confirmed_at");
		expect(REGISTRATION_HEATMAP_LAST_28D_SQL).toContain("players_type = 'pleiapp_player'");
		expect(REGISTRATION_HEATMAP_LAST_28D_SQL).toContain("PERCENTILE_CONT(0.5)");
	});

	it("rejects incomplete, non-finite, and non-positive rows", () => {
		expect(toRegistrationHeatmapCell({ lat: 1, lng: null, registration_weight: 1 })).toBeNull();
		expect(
			toRegistrationHeatmapCell({ lat: 1, lng: 2, registration_weight: Number.NaN }),
		).toBeNull();
		expect(toRegistrationHeatmapCell({ lat: 1, lng: 2, registration_weight: -1 })).toBeNull();
	});
});
