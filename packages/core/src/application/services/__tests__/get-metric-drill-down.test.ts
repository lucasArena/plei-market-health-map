import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import { makeGetMetricDrillDown } from "@core/application/services/get-metric-drill-down";
import type { MetricDrillDownInput } from "@core/application/services/get-metric-drill-down.types";

const getMetricDrillDown = makeGetMetricDrillDown();

const facility: FacilityPointView = {
	id: "a",
	name: "Arena",
	marketId: "miami",
	marketName: "Miami",
	avatarUrl: null,
	location: { latitude: 25, longitude: -80 },
	isActive: true,
	isActiveLastWeek: false,
	gamesLast28Days: 10,
	gamesLastWeek: 0,
	gamesByDepartment: { magic: 2, organizers: 3, partnerships: 5 },
	gamesLastWeekByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
};
const input: MetricDrillDownInput = {
	facilities: [facility],
	period: "month",
	measure: "games",
	slice: "market",
	segment: "none",
	now: new Date("2026-10-08T12:00:00Z"),
};
describe("getMetricDrillDown", () => {
	it("matches the warehouse calendar before Honolulu midnight, including Monday boundaries", () => {
		const now = new Date("2026-10-05T08:00:00Z");
		expect(getMetricDrillDown({ ...input, now })).toMatchObject({
			start: "2026-09-06",
			end: "2026-10-03",
		});
		expect(getMetricDrillDown({ ...input, now, period: "week" })).toMatchObject({
			start: "2026-09-21",
			end: "2026-09-27",
		});
	});

	it("groups games by market and returns the completed rolling window", () => {
		expect(getMetricDrillDown(input)).toEqual({
			total: 10,
			start: "2026-09-10",
			end: "2026-10-07",
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
	it("uses the last completed Monday–Sunday week and its department counts", () => {
		expect(getMetricDrillDown({ ...input, period: "week", slice: "facility" })).toMatchObject({
			total: 0,
			start: "2026-09-28",
			end: "2026-10-04",
			rows: [
				{
					id: "a",
					name: "Arena",
					value: 0,
					departments: { magic: 0, organizers: 0, partnerships: 0 },
				},
			],
		});
	});
	it("counts merged facility IDs once and sums markets and departments", () => {
		const other = { ...facility, id: "b" };
		const result = getMetricDrillDown({ ...input, facilities: [facility, facility, other] });
		expect(result.total).toBe(20);
		expect(result.rows[0]).toMatchObject({
			value: 20,
			departments: { magic: 4, organizers: 6, partnerships: 10 },
		});
	});
	it("scopes to market or facility and excludes other records", () => {
		const other = { ...facility, id: "b", marketId: "orlando" };
		expect(
			getMetricDrillDown({ ...input, facilities: [facility, other], marketId: "miami" }).total,
		).toBe(10);
		expect(
			getMetricDrillDown({ ...input, facilities: [facility, other], facilityId: "b" }).rows[0]?.id,
		).toBe("orlando");
		expect(getMetricDrillDown({ ...input, marketId: "missing" })).toMatchObject({
			total: 0,
			rows: [],
		});
	});
	it("counts active facilities using the selected period rather than their game count", () => {
		expect(getMetricDrillDown({ ...input, measure: "active-facilities" }).total).toBe(1);
		expect(
			getMetricDrillDown({ ...input, measure: "active-facilities", period: "week" }).total,
		).toBe(0);
	});
	it("groups games into disjoint departments", () => {
		expect(
			getMetricDrillDown({ ...input, slice: "department" }).rows.map((row) => [row.id, row.value]),
		).toEqual([
			["magic", 2],
			["organizers", 3],
			["partnerships", 5],
		]);
	});
	it("keeps a department while drilling into facilities", () => {
		expect(getMetricDrillDown({ ...input, slice: "facility", department: "magic" })).toMatchObject({
			total: 2,
			rows: [{ value: 2 }],
		});
	});
	it("preserves missing counts and prevents partial totals", () => {
		const unknown = {
			...facility,
			id: "b",
			gamesLast28Days: undefined,
			gamesByDepartment: undefined,
			gamesLastWeek: undefined,
			gamesLastWeekByDepartment: undefined,
		};
		expect(getMetricDrillDown({ ...input, facilities: [facility, unknown] })).toMatchObject({
			total: null,
			rows: [{ value: null, departments: null }],
		});
		expect(getMetricDrillDown({ ...input, facilities: [unknown, facility] })).toMatchObject({
			total: null,
			rows: [{ value: null, departments: null }],
		});
		expect(
			getMetricDrillDown({ ...input, facilities: [unknown], period: "week" }).total,
		).toBeNull();
		expect(
			getMetricDrillDown({ ...input, facilities: [unknown], slice: "department" }).rows.every(
				(row) => row.value === null,
			),
		).toBe(true);
		expect(
			getMetricDrillDown({ ...input, facilities: [unknown], department: "magic" }).total,
		).toBeNull();
		expect(
			getMetricDrillDown({ ...input, facilities: [unknown], measure: "active-facilities" }).total,
		).toBe(1);
	});
});
