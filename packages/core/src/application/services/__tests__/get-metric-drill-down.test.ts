import { ForbiddenError } from "@core/application/errors/forbidden-error";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import type { DrillDownFacilityFact } from "@core/application/services/aggregate-metric-drill-down.types";
import {
	aggregateCountDrillDown,
	aggregateDistinctCountDrillDown,
	aggregateRateDrillDown,
	drillDownRangeDays,
	drillDownWindow,
	factsFromFacilityPoints,
	makeGetMetricDrillDown,
	rateValue,
} from "@core/application/services/get-metric-drill-down";
import { FixedClock } from "@core/application/testing/fakes";
import { InMemoryMetricDrillDownRepository } from "@core/application/testing/in-memory-metric-drill-down-repository";

const facility: DrillDownFacilityFact = {
	id: "a",
	name: "Arena",
	marketId: "miami",
	marketName: "Miami",
	games: 10,
	gamesByDepartment: { magic: 2, organizers: 3, partnerships: 5 },
};

const weekFacility: DrillDownFacilityFact = {
	...facility,
	games: 0,
	gamesByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
};

function setup(facilities: DrillDownFacilityFact[] = [facility]) {
	const drillDown = new InMemoryMetricDrillDownRepository(facilities);
	const getMetricDrillDown = makeGetMetricDrillDown({
		drillDown,
		clock: new FixedClock(new Date("2026-10-08T12:00:00Z")),
		enabledFeatureFlags: async () => ({ enabled: ["metric-drill-down"] }),
	});
	return { getMetricDrillDown, drillDown };
}

describe("getMetricDrillDown", () => {
	it("groups games by market for the selected range ending yesterday", async () => {
		const { getMetricDrillDown } = setup();
		await expect(
			getMetricDrillDown({ measure: "games", range: "28d", slice: "market" }),
		).resolves.toEqual({
			total: 10,
			start: "2026-09-10",
			end: "2026-10-07",
			measure: "games",
			range: "28d",
			kind: "count",
			rows: [
				{
					id: "miami",
					name: "Miami",
					value: 10,
					departments: { magic: 2, organizers: 3, partnerships: 5 },
				},
			],
		});
	});

	it("supports 7d, 90d, 6m and 12m windows", async () => {
		const { getMetricDrillDown } = setup([weekFacility]);
		await expect(
			getMetricDrillDown({ measure: "games", range: "7d", slice: "facility" }),
		).resolves.toMatchObject({
			total: 0,
			start: "2026-10-01",
			end: "2026-10-07",
			range: "7d",
		});
		const { getMetricDrillDown: longer } = setup();
		await expect(
			longer({ measure: "games", range: "90d", slice: "market" }),
		).resolves.toMatchObject({ start: "2026-07-10", end: "2026-10-07", total: 10 });
		await expect(longer({ measure: "games", range: "6m", slice: "market" })).resolves.toMatchObject(
			{ start: "2026-04-11", end: "2026-10-07", total: 10 },
		);
		await expect(
			longer({ measure: "games", range: "12m", slice: "market" }),
		).resolves.toMatchObject({ start: "2025-10-08", end: "2026-10-07", total: 10 });
	});

	it("applies department filters to totals, groups and segments", async () => {
		const { getMetricDrillDown } = setup();
		const result = await getMetricDrillDown({
			measure: "games",
			range: "28d",
			slice: "department",
			departments: ["magic", "organizers"],
		});
		expect(result.total).toBe(5);
		expect(result.rows.map((row) => [row.id, row.value])).toEqual([
			["magic", 2],
			["organizers", 3],
		]);
		expect(
			await getMetricDrillDown({
				measure: "active-facilities",
				range: "28d",
				slice: "market",
				departments: ["magic"],
			}),
		).toMatchObject({ total: 1 });
	});

	it("keeps unavailable department data unknown when filtering", async () => {
		const { getMetricDrillDown } = setup([{ ...facility, gamesByDepartment: null }]);
		await expect(
			getMetricDrillDown({
				measure: "games",
				range: "28d",
				slice: "market",
				departments: ["magic"],
			}),
		).resolves.toMatchObject({ total: null });
		await expect(
			getMetricDrillDown({
				measure: "active-facilities",
				range: "28d",
				slice: "market",
				departments: ["magic"],
			}),
		).resolves.toMatchObject({ total: null });
	});

	it("scopes to market or facility and counts active facilities", async () => {
		const other = { ...facility, id: "b", marketId: "orlando", marketName: "Orlando", games: 4 };
		const { getMetricDrillDown } = setup([facility, other]);
		await expect(
			getMetricDrillDown({
				measure: "games",
				range: "28d",
				slice: "market",
				marketId: "miami",
			}),
		).resolves.toMatchObject({ total: 10 });
		await expect(
			getMetricDrillDown({
				measure: "active-facilities",
				range: "28d",
				slice: "facility",
			}),
		).resolves.toMatchObject({ total: 2 });
	});

	it("preserves missing counts and rejects invalid or disabled requests", async () => {
		const unknown = { ...facility, id: "b", games: null, gamesByDepartment: null };
		const { getMetricDrillDown } = setup([facility, unknown]);
		await expect(
			getMetricDrillDown({ measure: "games", range: "28d", slice: "market" }),
		).resolves.toMatchObject({ total: null });
		await expect(
			getMetricDrillDown({
				measure: "active-facilities",
				range: "28d",
				slice: "department",
			}),
		).rejects.toBeInstanceOf(InvalidRequestError);
		const denied = makeGetMetricDrillDown({
			drillDown: new InMemoryMetricDrillDownRepository([facility]),
			clock: new FixedClock(new Date("2026-10-08T12:00:00Z")),
			enabledFeatureFlags: async () => ({ enabled: [] }),
		});
		await expect(
			denied({ measure: "games", range: "28d", slice: "market" }),
		).rejects.toBeInstanceOf(ForbiddenError);
	});
});

describe("aggregateDistinctCountDrillDown", () => {
	it("counts a player once in the total when they appear in two facilities", () => {
		const result = aggregateDistinctCountDrillDown({
			contributions: [
				{ id: "a", name: "Arena", memberKeys: ["player-1", "player-2"] },
				{ id: "b", name: "Bay", memberKeys: ["player-1", "player-3"] },
			],
			sliceKeys: (contribution) => [{ id: contribution.id, name: contribution.name }],
			measure: "games",
			range: "28d",
			start: "2026-09-10",
			end: "2026-10-07",
		});
		expect(result.rows.map((row) => row.value)).toEqual([2, 2]);
		expect(result.total).toBe(3);
		expect(result.total).not.toBe(4);
		expect(result.kind).toBe("distinct-count");
	});

	it("narrows distinct keys to a selected department", () => {
		const result = aggregateDistinctCountDrillDown({
			contributions: [
				{
					id: "a",
					name: "Arena",
					memberKeys: ["player-1", "player-2"],
					departments: { magic: ["player-1"], organizers: ["player-2"] },
				},
			],
			sliceKeys: (contribution) => [{ id: contribution.id, name: contribution.name }],
			department: "magic",
			measure: "games",
			range: "28d",
			start: "2026-09-10",
			end: "2026-10-07",
		});
		expect(result).toMatchObject({ total: 1, rows: [{ value: 1 }] });
	});
});

describe("aggregateRateDrillDown", () => {
	it("totals rates as the summed numerator over the summed denominator", () => {
		const result = aggregateRateDrillDown({
			contributions: [
				{ id: "a", name: "Arena", numerator: 1, denominator: 2 },
				{ id: "b", name: "Bay", numerator: 1, denominator: 10 },
			],
			measure: "games",
			range: "28d",
			start: "2026-09-10",
			end: "2026-10-07",
		});
		expect(result.rows.map((row) => row.value)).toEqual([0.5, 0.1]);
		expect(result.total).toBeCloseTo(2 / 12);
		expect(result.total).not.toBeCloseTo((0.5 + 0.1) / 2);
		expect(result.kind).toBe("rate");
	});

	it("returns unavailable when a rate part is missing or the denominator is zero", () => {
		expect(rateValue(1, 0)).toBeNull();
		expect(rateValue(null, 4)).toBeNull();
		expect(
			aggregateRateDrillDown({
				contributions: [
					{
						id: "a",
						name: "Arena",
						numerator: 1,
						denominator: 2,
						departments: { magic: { numerator: null, denominator: 2 } },
					},
				],
				department: "magic",
				measure: "games",
				range: "28d",
				start: "2026-09-10",
				end: "2026-10-07",
			}).total,
		).toBeNull();
	});
});

describe("aggregateCountDrillDown", () => {
	it("deduplicates facility ids and groups departments", () => {
		const result = aggregateCountDrillDown({
			facilities: [facility, facility, { ...facility, id: "b", games: 10 }],
			measure: "games",
			slice: "department",
			start: "2026-09-10",
			end: "2026-10-07",
			range: "28d",
		});
		expect(result.total).toBe(20);
		expect(result.rows.map((row) => [row.id, row.value])).toEqual([
			["magic", 4],
			["organizers", 6],
			["partnerships", 10],
		]);
	});

	it("keeps a department while drilling into facilities and skips zero filtered games", () => {
		expect(
			aggregateCountDrillDown({
				facilities: [facility],
				measure: "games",
				slice: "facility",
				department: "magic",
				start: "2026-09-10",
				end: "2026-10-07",
				range: "28d",
			}),
		).toMatchObject({ total: 2, rows: [{ value: 2 }] });
		expect(
			aggregateCountDrillDown({
				facilities: [facility],
				measure: "games",
				slice: "market",
				gameDepartments: ["magic"],
				start: "2026-10-01",
				end: "2026-10-07",
				range: "7d",
			}),
		).toMatchObject({
			total: 2,
		});
		expect(
			aggregateCountDrillDown({
				facilities: [
					{
						...facility,
						games: 0,
						gamesByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
					},
				],
				measure: "games",
				slice: "market",
				gameDepartments: ["magic"],
				start: "2026-10-01",
				end: "2026-10-07",
				range: "7d",
			}).rows,
		).toEqual([]);
	});
});

describe("drill-down window helpers", () => {
	it("maps ranges to day counts and windows ending yesterday", () => {
		expect(drillDownRangeDays("90d")).toBe(90);
		expect(drillDownRangeDays("6m")).toBe(180);
		expect(drillDownRangeDays("12m")).toBe(365);
		expect(drillDownWindow(new Date("2026-10-08T12:00:00Z"), "America/New_York", "7d")).toEqual({
			start: "2026-10-01",
			end: "2026-10-07",
		});
		expect(
			factsFromFacilityPoints(
				[
					{
						id: "a",
						name: "Arena",
						marketId: "miami",
						marketName: "Miami",
						gamesLastWeek: 3,
						gamesLast28Days: 10,
						gamesLastWeekByDepartment: { magic: 1, organizers: 1, partnerships: 1 },
						gamesByDepartment: { magic: 2, organizers: 3, partnerships: 5 },
					},
					{
						id: "b",
						name: "Bay",
						marketId: "miami",
						marketName: "Miami",
					},
				],
				"7d",
			),
		).toEqual([
			{
				id: "a",
				name: "Arena",
				marketId: "miami",
				marketName: "Miami",
				games: 3,
				gamesByDepartment: { magic: 1, organizers: 1, partnerships: 1 },
			},
			{
				id: "b",
				name: "Bay",
				marketId: "miami",
				marketName: "Miami",
				games: null,
				gamesByDepartment: null,
			},
		]);
		expect(
			factsFromFacilityPoints(
				[{ id: "a", name: "Arena", marketId: "miami", marketName: "Miami", gamesLast28Days: 9 }],
				"90d",
			)[0],
		).toMatchObject({ games: 9, gamesByDepartment: null });
	});
});
