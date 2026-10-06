import {
	appSessionHeatmapSql,
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

		const cells = await new WarehouseAppSessionHeatmapRepository({ query }).listSessions("month");

		expect(query).toHaveBeenCalledWith(appSessionHeatmapSql("month"));
		expect(appSessionHeatmapSql("month")).toContain("CURRENT_DATE - 28");
		expect(appSessionHeatmapSql("month")).toContain("date < CURRENT_DATE");
		expect(appSessionHeatmapSql("month")).toContain("SUM(q_sessions)");
		expect(appSessionHeatmapSql("week")).toContain(
			"date >= date_trunc('week', CURRENT_DATE)::date - 7\n  AND date < date_trunc('week', CURRENT_DATE)::date",
		);
		expect(cells).toEqual([{ lat: 29.746, lng: -95.352, sessionWeight: 1134 }]);
	});
});

it("binds filters as parameters and uses EXISTS to avoid multiplying sessions", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [row()] });
	await new WarehouseAppSessionHeatmapRepository({ query }).listSessions("month", {
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
	await new WarehouseAppSessionHeatmapRepository({ query }).listSessions("month", { ageMin: 45 });
	expect(query.mock.calls[0]?.[1]).toEqual([45]);
	expect(query.mock.calls[0]?.[0]).not.toContain("p.gender");
	expect(query.mock.calls[0]?.[0]).not.toContain("p.age_integer <=");
});
it("returns distinct stored profile choices without inventing demographic values", async () => {
	const query = vi.fn().mockResolvedValue({
		rows: [
			{ gender: "Female", skill: "Advanced", age: 25 },
			{ gender: "Male", skill: "Beginner", age: "17" },
			{ gender: "Female", skill: "Advanced", age: 25 },
			{ gender: null, skill: null, age: null },
			{ gender: null, skill: null, age: -1 },
			{ gender: null, skill: null, age: 121 },
			{ gender: null, skill: null, age: "invalid" },
			{ gender: null, skill: null, age: 17.5 },
		],
	});
	expect(await new WarehouseAppSessionHeatmapRepository({ query }).listFilterOptions()).toEqual({
		genders: ["Female", "Male"],
		skills: ["Advanced", "Beginner"],
		ages: [17, 25],
	});
	expect(query.mock.calls[0]?.[0]).toContain("skill_description");
	expect(query.mock.calls[0]?.[0]).not.toContain("skill_level");
});

it("matches any selected value per field while combining fields", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [] });
	await new WarehouseAppSessionHeatmapRepository({ query }).listSessions("month", {
		gender: ["male", "female"],
		skill: ["Beginner", "Expert"],
	});
	const [sql, values] = query.mock.calls[0] ?? [];
	expect(values).toEqual([
		["male", "female"],
		["Beginner", "Expert"],
	]);
	expect(sql).toContain(
		"NULLIF(TRIM(p.gender::text), '') = ANY($1::text[]) AND NULLIF(TRIM(p.skill_description::text), '') = ANY($2::text[])",
	);
});
