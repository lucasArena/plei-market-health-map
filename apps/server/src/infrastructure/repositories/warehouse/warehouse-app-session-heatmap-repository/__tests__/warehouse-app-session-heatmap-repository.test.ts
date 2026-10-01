import {
	APP_SESSION_HEATMAP_LAST_28D_SQL,
	toAppSessionHeatmapCell,
	WarehouseAppSessionHeatmapRepository,
} from "@server/infrastructure/repositories/warehouse/warehouse-app-session-heatmap-repository/warehouse-app-session-heatmap-repository";

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

it("binds filters as parameters and uses EXISTS to avoid multiplying sessions", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [row()] });
	await new WarehouseAppSessionHeatmapRepository({ query }).listLast28Days({
		gender: "Female' OR 1=1 --",
		skill: "Advanced",
		ageMin: 0,
		ageMax: 17,
	});
	const [sql, values] = query.mock.calls[0] ?? [];
	expect(values).toEqual(["Female' OR 1=1 --", "Advanced", 0, 17]);
	expect(sql).not.toContain("OR 1=1");
	expect(sql).toContain("AND EXISTS");
	expect(sql).toContain("p.player_id = players_behaviour.player_id");
	expect(sql).toContain("p.age_integer >= $3");
	expect(sql).toContain("p.age_integer <= $4");
	expect(sql).toContain("SUM(q_sessions)");
});
it("uses only present predicates for open age bounds", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [] });
	await new WarehouseAppSessionHeatmapRepository({ query }).listLast28Days({ ageMin: 45 });
	expect(query.mock.calls[0]?.[1]).toEqual([45]);
	expect(query.mock.calls[0]?.[0]).not.toContain("p.gender");
	expect(query.mock.calls[0]?.[0]).not.toContain("p.age_integer <=");
});
it("returns distinct stored profile choices without inventing demographic values", async () => {
	const query = vi.fn().mockResolvedValue({
		rows: [
			{ gender: "Female", skill: "Advanced" },
			{ gender: "Male", skill: "Beginner" },
			{ gender: "Female", skill: "Advanced" },
			{ gender: null, skill: null },
		],
	});
	expect(await new WarehouseAppSessionHeatmapRepository({ query }).listFilterOptions()).toEqual({
		genders: ["Female", "Male"],
		skills: ["Advanced", "Beginner"],
	});
	expect(query.mock.calls[0]?.[0]).toContain("skill_description");
	expect(query.mock.calls[0]?.[0]).not.toContain("skill_level");
});
