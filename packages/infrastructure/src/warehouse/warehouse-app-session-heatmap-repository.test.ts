import {
	APP_SESSION_HEATMAP_LAST_28D_SQL,
	toAppSessionHeatmapCell,
	WarehouseAppSessionHeatmapRepository,
} from "@infra/warehouse/warehouse-app-session-heatmap-repository";

function row(overrides: object = {}) {
	return {
		lat: 29.746,
		lng: -95.352,
		session_weight: 1134,
		...overrides,
	};
}

describe("toAppSessionHeatmapCell", () => {
	it("maps a warehouse row to a heatmap cell", () => {
		expect(toAppSessionHeatmapCell(row())).toEqual({
			lat: 29.746,
			lng: -95.352,
			sessionWeight: 1134,
		});
	});

	it("skips invalid and non-positive weights", () => {
		expect(toAppSessionHeatmapCell(row({ lat: null }))).toBeNull();
		expect(toAppSessionHeatmapCell(row({ lng: "x" }))).toBeNull();
		expect(toAppSessionHeatmapCell(row({ session_weight: 0 }))).toBeNull();
		expect(toAppSessionHeatmapCell(row({ session_weight: -3 }))).toBeNull();
	});
});

describe("WarehouseAppSessionHeatmapRepository", () => {
	it("queries Kent's 28-day app-session heatmap SQL and keeps valid cells", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [row(), row({ lat: null, lng: -95, session_weight: 10 })],
		});

		const cells = await new WarehouseAppSessionHeatmapRepository({ query }).listLast28Days();

		expect(query).toHaveBeenCalledWith(APP_SESSION_HEATMAP_LAST_28D_SQL);
		expect(APP_SESSION_HEATMAP_LAST_28D_SQL).toContain("CURRENT_DATE - 28");
		expect(APP_SESSION_HEATMAP_LAST_28D_SQL).toContain("date < CURRENT_DATE");
		expect(APP_SESSION_HEATMAP_LAST_28D_SQL).toContain("SUM(q_sessions)");
		expect(cells).toEqual([{ lat: 29.746, lng: -95.352, sessionWeight: 1134 }]);
	});
});
