import {
	APP_SESSION_HEATMAP_SQL,
	sessionWindow,
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

const CLOCK = { now: () => new Date("2026-10-06T18:00:00Z") };

describe("sessionWindow", () => {
	it("covers the last completed Monday-to-Sunday week or the 28 days before today", () => {
		expect(sessionWindow("week", new Date("2026-10-11T23:59:00Z"))).toEqual([
			"2026-09-28",
			"2026-10-05",
		]);
		expect(sessionWindow("month", CLOCK.now())).toEqual(["2026-09-08", "2026-10-06"]);
	});
});

describe("WarehouseAppSessionHeatmapRepository", () => {
	it("queries Kent's 28-day app-session heatmap SQL and keeps valid cells", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [row(), row({ lat: null, lng: -95, session_weight: 10 })],
		});

		const repository = new WarehouseAppSessionHeatmapRepository({ query }, CLOCK);
		const cells = await repository.listSessions("month");
		await repository.listSessions("week");

		expect(query).toHaveBeenNthCalledWith(1, APP_SESSION_HEATMAP_SQL, ["2026-09-08", "2026-10-06"]);
		expect(query).toHaveBeenNthCalledWith(2, APP_SESSION_HEATMAP_SQL, ["2026-09-28", "2026-10-05"]);
		expect(APP_SESSION_HEATMAP_SQL).toContain("WHERE date >= $1::date\n  AND date < $2::date");
		expect(APP_SESSION_HEATMAP_SQL).not.toContain("CURRENT_DATE");
		expect(APP_SESSION_HEATMAP_SQL).toContain("SUM(q_sessions)");
		expect(cells).toEqual([{ lat: 29.746, lng: -95.352, sessionWeight: 1134 }]);
	});
});

it("binds filters as parameters and uses EXISTS to avoid multiplying sessions", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [row()] });
	await new WarehouseAppSessionHeatmapRepository({ query }, CLOCK).listSessions("month", {
		gender: "Female' OR 1=1 --",
		skill: "Advanced",
		ageMin: 0,
		ageMax: 17,
	});
	const [sql, values] = query.mock.calls[0] ?? [];
	expect(values).toEqual(["2026-09-08", "2026-10-06", "Female' OR 1=1 --", "Advanced", 0, 17]);
	expect(sql).not.toContain("OR 1=1");
	expect(sql).toContain("AND EXISTS");
	expect(sql).toContain("p.player_id = players_behaviour.player_id");
	expect(sql).toContain("p.age_integer >= $5");
	expect(sql).toContain("p.age_integer <= $6");
	expect(sql).toContain("SUM(q_sessions)");
});
it("uses only present predicates for open age bounds", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [] });
	await new WarehouseAppSessionHeatmapRepository({ query }, CLOCK).listSessions("month", {
		ageMin: 45,
	});
	expect(query.mock.calls[0]?.[1]).toEqual(["2026-09-08", "2026-10-06", 45]);
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
	expect(
		await new WarehouseAppSessionHeatmapRepository({ query }, CLOCK).listFilterOptions(),
	).toEqual({
		genders: ["Female", "Male"],
		skills: ["Advanced", "Beginner"],
		ages: [17, 25],
	});
	expect(query.mock.calls[0]?.[0]).toContain("skill_description");
	expect(query.mock.calls[0]?.[0]).not.toContain("skill_level");
});

it("matches any selected value per field while combining fields", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [] });
	await new WarehouseAppSessionHeatmapRepository({ query }, CLOCK).listSessions("month", {
		gender: ["male", "female"],
		skill: ["Beginner", "Expert"],
	});
	const [sql, values] = query.mock.calls[0] ?? [];
	expect(values).toEqual(["2026-09-08", "2026-10-06", ["male", "female"], ["Beginner", "Expert"]]);
	expect(sql).toContain(
		"NULLIF(TRIM(p.gender::text), '') = ANY($3::text[]) AND NULLIF(TRIM(p.skill_description::text), '') = ANY($4::text[])",
	);
});

it("counts confirmed app registrations once per region over completed days", async () => {
	const query = vi.fn().mockResolvedValue({ rows: [row()] });
	const repository = new WarehouseAppSessionHeatmapRepository({ query }, CLOCK);
	expect(await repository.listSessions("month", { metric: "registrations" })).toEqual([
		{ lat: 29.746, lng: -95.352, sessionWeight: 1134 },
	]);
	const sql = query.mock.calls[0]?.[0];
	expect(sql).toContain("COUNT(DISTINCT p.player_id)");
	expect(sql).toContain("p.confirmed_at >= CURRENT_DATE - 28");
	expect(sql).toContain("p.confirmed_at < CURRENT_DATE");
	expect(sql).toContain("p.players_type = 'pleiapp_player'");
	expect(sql).toContain("GROUP BY region_id");
	expect(sql).toContain("percentile_cont(0.5)");
	expect(sql).not.toContain("players_behaviour");
	await repository.listSessions("month", {
		metric: "registrations",
		gender: ["Female", "Male"],
		skill: "Advanced",
		ageMin: 18,
		ageMax: 40,
	});
	expect(query.mock.calls[1]?.[1]).toEqual([["Female", "Male"], "Advanced", 18, 40]);
	expect(query.mock.calls[1]?.[0]).toContain(
		"AND NULLIF(TRIM(p.gender::text), '') = ANY($1::text[])",
	);
});
