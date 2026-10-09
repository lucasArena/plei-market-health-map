import {
	canSegmentDrillDown,
	canSliceDrillDownByDepartment,
	canSliceDrillDownByOrganizer,
	crossesAppTrackingSourceSwitch,
	needsOrganizerDimension,
} from "@core/application/dtos/metric-drill-down-dto";
import type { DrillDownMeasure } from "@core/application/dtos/metric-drill-down-dto.types";
import { ForbiddenError } from "@core/application/errors/forbidden-error";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import type { DrillDownFacilityFact } from "@core/application/services/aggregate-metric-drill-down.types";
import {
	inclusiveDays,
	toAverageDailyGamesView,
} from "@core/application/services/average-daily-games-view";
import {
	aggregateCountDrillDown,
	aggregateDistinctCountDrillDown,
	aggregateDrillDownFromFacts,
	aggregateRateDrillDown,
	distinctContributionsFromFacts,
	drillDownRangeDays,
	drillDownWindow,
	factsFromFacilityPoints,
	makeGetMetricDrillDown,
	rateContributionsFromFacts,
	rateFactParts,
	rateValue,
	scheduledFactsFrom,
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
	scheduled: 12,
	scheduledByDepartment: { magic: 3, organizers: 3, partnerships: 6 },
	uniquePlayerIds: ["p1", "p2"],
	uniquePlayerIdsByDepartment: { magic: ["p1"], organizers: ["p2"], partnerships: [] },
	activatedPlayerIds: ["p2"],
	activatedPlayerIdsByDepartment: { magic: [], organizers: ["p2"], partnerships: [] },
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
		).resolves.toMatchObject({
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

	it("groups scheduled games, confirmation rate and distinct players", async () => {
		const other: DrillDownFacilityFact = {
			...facility,
			id: "b",
			name: "Bay",
			games: 45,
			scheduled: 60,
			gamesByDepartment: { magic: 10, organizers: 15, partnerships: 20 },
			scheduledByDepartment: { magic: 12, organizers: 20, partnerships: 28 },
			uniquePlayerIds: ["p1", "p3"],
			uniquePlayerIdsByDepartment: { magic: ["p1"], organizers: ["p3"], partnerships: [] },
			activatedPlayerIds: ["p3"],
			activatedPlayerIdsByDepartment: { magic: [], organizers: ["p3"], partnerships: [] },
		};
		const { getMetricDrillDown } = setup([facility, other]);
		await expect(
			getMetricDrillDown({ measure: "scheduled-games", range: "28d", slice: "facility" }),
		).resolves.toMatchObject({
			total: 72,
			kind: "count",
			measure: "scheduled-games",
			rows: [
				{ id: "a", value: 12 },
				{ id: "b", value: 60 },
			],
		});
		const rate = await getMetricDrillDown({
			measure: "confirmation-rate",
			range: "7d",
			slice: "facility",
			facilityId: "b",
		});
		expect(rate.total).toBe(75);
		expect(rate.kind).toBe("rate");
		expect(rate.rows[0]?.value).toBe(75);
		expect(rate.total).not.toBe(1 - 15 / 60);
		const empty = await getMetricDrillDown({
			measure: "confirmation-rate",
			range: "28d",
			slice: "facility",
		});
		expect(empty.rows.find((row) => row.id === "a")?.value).toBe(83.3);
		const zeroScheduled: DrillDownFacilityFact = {
			...facility,
			id: "c",
			scheduled: 0,
			games: 0,
			scheduledByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
			gamesByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
		};
		const { getMetricDrillDown: none } = setup([zeroScheduled]);
		await expect(
			none({ measure: "confirmation-rate", range: "28d", slice: "facility" }),
		).resolves.toMatchObject({ total: null, rows: [{ value: null }] });
		const uniqueByDepartment = await getMetricDrillDown({
			measure: "unique-players",
			range: "28d",
			slice: "department",
		});
		expect(uniqueByDepartment.rows.map((row) => [row.id, row.value])).toEqual([
			["magic", 1],
			["organizers", 2],
			["partnerships", 0],
		]);
		expect(uniqueByDepartment.total).toBe(3);
		const rateByDepartment = await getMetricDrillDown({
			measure: "confirmation-rate",
			range: "28d",
			slice: "department",
			departments: ["magic"],
		});
		expect(rateByDepartment.rows).toEqual([expect.objectContaining({ id: "magic", value: 80 })]);
		const unique = await getMetricDrillDown({
			measure: "unique-players",
			range: "28d",
			slice: "facility",
		});
		expect(unique.rows.map((row) => row.value)).toEqual([2, 2]);
		expect(unique.total).toBe(3);
		expect(unique.kind).toBe("distinct-count");
		const activated = await getMetricDrillDown({
			measure: "activated-players",
			range: "28d",
			slice: "market",
			departments: ["organizers"],
		});
		expect(activated.total).toBe(2);
		expect(activated.rows[0]?.value).toBe(2);
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

	it("keeps department segments as distinct counts per department", () => {
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
			measure: "unique-players",
			range: "28d",
			start: "2026-09-10",
			end: "2026-10-07",
		});
		expect(result.rows[0]?.departments).toEqual({
			magic: 1,
			organizers: 1,
			partnerships: 0,
		});
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

describe("almost-filled and incident measures", () => {
	const quality: DrillDownFacilityFact = {
		...facility,
		almostFilled: 2,
		almostFilledByDepartment: { magic: 1, organizers: 1, partnerships: 0 },
		rosteredCanceled: 8,
		rosteredCanceledByDepartment: { magic: 4, organizers: 4, partnerships: 0 },
		missingRoster: 3,
		missingRosterByDepartment: { magic: 0, organizers: 3, partnerships: 0 },
		incidentGames: 1,
		incidentGamesByDepartment: { magic: 0, organizers: 1, partnerships: 0 },
	};

	it("returns almost-filled rate with its parts and data errors", async () => {
		const { getMetricDrillDown } = setup([quality]);
		const view = await getMetricDrillDown({
			measure: "almost-filled-rate",
			range: "28d",
			slice: "market",
		});
		expect(view).toMatchObject({
			kind: "rate",
			total: 25,
			numerator: 2,
			denominator: 8,
			dataErrors: 3,
			rows: [
				{
					id: "miami",
					numerator: 2,
					denominator: 8,
					dataErrors: 3,
					departments: { magic: 25, organizers: 25, partnerships: null },
				},
			],
		});
		const departments = await getMetricDrillDown({
			measure: "almost-filled-rate",
			range: "28d",
			slice: "department",
		});
		expect(departments.rows.find((row) => row.id === "organizers")).toMatchObject({
			dataErrors: 3,
			value: 25,
		});
	});

	it("keeps almost-filled unavailable when rosters are unknown", async () => {
		const { getMetricDrillDown } = setup([facility]);
		const view = await getMetricDrillDown({
			measure: "almost-filled-rate",
			range: "28d",
			slice: "facility",
		});
		expect(view.total).toBeNull();
		expect(view.dataErrors).toBe(0);
		expect(view.rows[0]?.departments).toEqual({
			magic: null,
			organizers: null,
			partnerships: null,
		});
	});

	it("rates incident games over happened games and rejects the removed count", async () => {
		const { getMetricDrillDown } = setup([quality]);
		await expect(
			getMetricDrillDown({
				measure: "incident-games" as DrillDownMeasure,
				range: "28d",
				slice: "market",
			}),
		).rejects.toBeInstanceOf(InvalidRequestError);
		const rate = await getMetricDrillDown({
			measure: "incident-games-rate",
			range: "28d",
			slice: "facility",
		});
		expect(rate).toMatchObject({ total: 10, numerator: 1, denominator: 10 });
		expect(rate.dataErrors).toBeUndefined();
		expect(
			rateContributionsFromFacts([quality], "facility", { measure: "games" })[0],
		).toMatchObject({ numerator: 10, denominator: 12 });
	});

	it("keeps facts without quality data unknown instead of zero", () => {
		const bare: DrillDownFacilityFact = {
			id: "b",
			name: "Bay",
			marketId: "miami",
			marketName: "Miami",
			games: null,
			gamesByDepartment: null,
		};
		expect(rateFactParts(bare, "confirmation-rate")).toMatchObject({
			numerator: null,
			denominator: null,
			denominatorByDepartment: null,
		});
		expect(rateFactParts(bare, "almost-filled-rate")).toEqual({
			numerator: null,
			denominator: null,
			numeratorByDepartment: null,
			denominatorByDepartment: null,
			dataErrors: 0,
			dataErrorsByDepartment: null,
		});
		expect(rateFactParts(bare, "incident-games-rate")).toMatchObject({
			numerator: null,
			numeratorByDepartment: null,
		});
		expect(scheduledFactsFrom([bare])[0]).toMatchObject({ games: null, gamesByDepartment: null });
		expect(
			rateContributionsFromFacts([bare], "department", {
				measure: "almost-filled-rate",
				gameDepartments: ["magic"],
			}),
		).toEqual([{ id: "magic", name: "magic", numerator: null, denominator: null, dataErrors: 0 }]);
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

describe("drill-down measure helpers", () => {
	it("allows department slices and segments except for active facilities", () => {
		expect(canSliceDrillDownByDepartment("confirmation-rate")).toBe(true);
		expect(canSliceDrillDownByDepartment("active-facilities")).toBe(false);
		expect(canSegmentDrillDown("scheduled-games", "market")).toBe(true);
		expect(canSegmentDrillDown("unique-players", "department")).toBe(false);
		expect(canSegmentDrillDown("active-facilities", "facility")).toBe(false);
	});

	it("allows organizer slices and keeps them distinct from Magic", async () => {
		const { getMetricDrillDown } = setup([
			{
				...facility,
				organizers: [
					{
						id: "club",
						name: "Club",
						games: 3,
						scheduled: 4,
						uniquePlayerIds: ["p2"],
						activatedPlayerIds: ["p2"],
					},
				],
			},
		]);
		const view = await getMetricDrillDown({
			measure: "games",
			range: "28d",
			slice: "organizer",
		});
		expect(view.total).toBe(3);
		expect(view.rows).toEqual([
			expect.objectContaining({ id: "club", name: "Club", value: 3, departments: null }),
		]);
		expect(canSliceDrillDownByOrganizer("games")).toBe(true);
		expect(canSliceDrillDownByOrganizer("app-sessions")).toBe(false);
		expect(canSegmentDrillDown("games", "organizer")).toBe(false);
		expect(canSegmentDrillDown("games", "time")).toBe(true);
		expect(needsOrganizerDimension("market", "organizer")).toBe(true);
		expect(needsOrganizerDimension("organizer")).toBe(true);
		expect(needsOrganizerDimension("market", "department")).toBe(false);
		await expect(
			getMetricDrillDown({ measure: "app-sessions", range: "7d", slice: "organizer" }),
		).rejects.toBeInstanceOf(InvalidRequestError);
		const segmented = await getMetricDrillDown({
			measure: "games",
			range: "28d",
			slice: "market",
			segment: "organizer",
		});
		expect(segmented.rows[0]?.organizers).toEqual([
			expect.objectContaining({ id: "club", name: "Club", value: 3 }),
		]);
	});

	it("builds department contributions from facility facts", () => {
		expect(
			rateContributionsFromFacts([facility], "department", { gameDepartments: ["magic"] }),
		).toEqual([{ id: "magic", name: "magic", numerator: 2, denominator: 3, facilityIds: ["a"] }]);
		expect(
			distinctContributionsFromFacts([facility], "department", "unique-players", {
				gameDepartments: ["organizers"],
			}),
		).toEqual([{ id: "organizers", name: "organizers", memberKeys: ["p2"], facilityIds: ["a"] }]);
		expect(
			distinctContributionsFromFacts(
				[{ ...facility, activatedPlayerIds: undefined, activatedPlayerIdsByDepartment: null }],
				"facility",
				"activated-players",
			),
		).toEqual([
			{
				id: "a",
				name: "Arena",
				memberKeys: [],
				facilityIds: ["a"],
				departments: { magic: [], organizers: [], partnerships: [] },
			},
		]);
		expect(
			rateContributionsFromFacts(
				[{ ...facility, gamesByDepartment: null, scheduledByDepartment: null }],
				"department",
			),
		).toEqual(
			["magic", "organizers", "partnerships"].map((department) => ({
				id: department,
				name: department,
				numerator: null,
				denominator: null,
				facilityIds: ["a"],
			})),
		);
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
		expect(
			factsFromFacilityPoints(
				[{ id: "a", name: "Arena", marketId: "miami", marketName: "Miami" }],
				"28d",
			)[0],
		).toMatchObject({ games: null, gamesByDepartment: null });
	});
});

it.each(["app-sessions", "registrations", "unique-users"] as const)(
	"normalizes %s to market and ignores supply filters",
	async (measure) => {
		const group = vi.fn().mockResolvedValue({ total: null, rows: [] });
		const get = makeGetMetricDrillDown({
			drillDown: { group },
			clock: new FixedClock(new Date("2026-10-08T12:00:00Z")),
			enabledFeatureFlags: async () => ({ enabled: ["metric-drill-down"] }),
		});
		await get({
			measure,
			range: "7d",
			slice: "department",
			facilityId: "a",
			marketId: "miami",
			department: "magic",
			departments: ["magic"],
		});
		expect(group).toHaveBeenCalledWith(
			expect.objectContaining({
				measure,
				slice: "market",
				facilityId: undefined,
				marketId: "miami",
				department: undefined,
				departments: [],
			}),
		);
		expect(canSliceDrillDownByDepartment(measure)).toBe(false);
		expect(canSegmentDrillDown(measure, "market")).toBe(false);
	},
);

it.each([
	["2026-06-29", "2026-06-30", true],
	["2026-06-28", "2026-06-29", false],
	["2026-06-30", "2026-07-01", false],
	["2026-01-01", "2026-10-07", true],
])("marks the tracking switch for %s through %s", (start, end, expected) => {
	expect(crossesAppTrackingSourceSwitch(String(start), String(end))).toBe(expected);
});

describe("time slice validation", () => {
	it.each(["day", "week", "month"] as const)("preserves %s for app time slices", async (grain) => {
		const { getMetricDrillDown, drillDown } = setup();
		const spy = vi.spyOn(drillDown, "group").mockResolvedValue({
			measure: "unique-users",
			range: "28d",
			kind: "distinct-count",
			start: "2026-09-10",
			end: "2026-10-04",
			total: 0,
			rows: [],
		});
		await getMetricDrillDown({
			measure: "unique-users",
			range: "28d",
			slice: "time",
			grain,
			departments: ["magic"],
			timeZone: "America/New_York",
		});
		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({ slice: "time", grain, departments: [], today: "2026-10-08" }),
		);
	});
	it("rejects mismatched calendar grain and slice", async () => {
		const { getMetricDrillDown } = setup();
		await expect(
			getMetricDrillDown({ measure: "games", range: "28d", slice: "time" }),
		).rejects.toBeInstanceOf(InvalidRequestError);
		await expect(
			getMetricDrillDown({ measure: "games", range: "28d", slice: "market", grain: "week" }),
		).rejects.toBeInstanceOf(InvalidRequestError);
	});
});

describe("previous period drill-down", () => {
	it.each(["7d", "28d", "90d", "6m", "12m"] as const)(
		"uses adjacent equal-length %s windows and matches group IDs",
		async (range) => {
			const { getMetricDrillDown, drillDown } = setup();
			const group = vi.spyOn(drillDown, "group");
			const view = await getMetricDrillDown({
				measure: "games",
				range,
				slice: "market",
				departments: ["magic"],
				timeZone: "Pacific/Honolulu",
			});
			expect(group).toHaveBeenCalledTimes(2);
			expect(group.mock.calls[1]?.[0]).toMatchObject({
				today: view.start,
				previousPeriod: true,
				departments: ["magic"],
				measure: "games",
				range,
				slice: "market",
			});
			expect(view.previousTotal).toBe(view.total);
			expect(view.rows[0]?.previousValue).toBe(view.rows[0]?.value);
			expect(view.rows[0]?.previousDepartments).toEqual(view.rows[0]?.departments);
			expect(Date.parse(view.end) - Date.parse(view.start)).toBe(
				Date.parse(view.previousEnd as string) - Date.parse(view.previousStart as string),
			);
			expect(Date.parse(view.start) - Date.parse(view.previousEnd as string)).toBe(86400000);
		},
	);
	it("does not request comparisons for time grouping", async () => {
		const { getMetricDrillDown, drillDown } = setup();
		const group = vi.spyOn(drillDown, "group");
		const view = await getMetricDrillDown({
			measure: "games",
			range: "28d",
			slice: "time",
			grain: "day",
		});
		expect(group).toHaveBeenCalledTimes(1);
		expect(view.previousTotal).toBeUndefined();
	});
	it("retains prior-only markets and distinguishes missing rates from zero counts", async () => {
		const { getMetricDrillDown, drillDown } = setup();
		const current = await drillDown.group({
			measure: "games",
			range: "28d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		vi.spyOn(drillDown, "group")
			.mockResolvedValueOnce(current)
			.mockResolvedValueOnce({
				...current,
				total: 20,
				rows: [{ id: "old", name: "Old", value: 20, departments: null }],
			});
		const view = await getMetricDrillDown({ measure: "games", range: "28d", slice: "market" });
		expect(view.rows).toEqual([
			expect.objectContaining({ id: "miami", value: 10, previousValue: 0 }),
			expect.objectContaining({ id: "old", value: 0, previousValue: 20 }),
		]);
	});
});

it.each([
	["week", "2026-10-01", "2026-09-03", "2026-09-30"],
	["month", "2026-09-08", "2026-08-11", "2026-09-07"],
	["year", "2025-10-08", "2025-09-10", "2025-10-07"],
] as const)(
	"queries the selected %s comparison with the same measure and filters",
	async (comparison, today, start, end) => {
		const { getMetricDrillDown, drillDown } = setup();
		const group = vi.spyOn(drillDown, "group");
		const view = await getMetricDrillDown({
			measure: "games",
			range: "28d",
			slice: "facility",
			comparison,
			marketId: "miami",
			departments: ["magic"],
		});
		expect(group.mock.calls[1]?.[0]).toMatchObject({
			today,
			range: "28d",
			measure: "games",
			slice: "facility",
			marketId: "miami",
			departments: ["magic"],
		});
		expect(view).toMatchObject({ previousStart: start, previousEnd: end });
	},
);

describe("average daily games", () => {
	it("divides games played by the days in the window, for the total, rows and previous period", async () => {
		const { getMetricDrillDown } = setup();
		const view = await getMetricDrillDown({
			measure: "avg-daily-games",
			range: "28d",
			slice: "market",
			departments: [],
			timeZone: "America/New_York",
		});
		expect(view.measure).toBe("avg-daily-games");
		expect(view.kind).toBe("count");
		expect(view.total).toBe(0.4);
		expect(view.rows[0]?.value).toBe(0.4);
		expect(view.rows[0]?.departments).toEqual({ magic: 0.1, organizers: 0.1, partnerships: 0.2 });
	});

	it("uses each bucket's own length on the time slice", () => {
		const view = toAverageDailyGamesView({
			measure: "games",
			range: "28d",
			kind: "count",
			start: "2026-09-01",
			end: "2026-09-14",
			total: 28,
			rows: [
				{
					id: "2026-09-07",
					name: "2026-09-07",
					bucketStart: "2026-09-07",
					bucketEnd: "2026-09-13",
					value: 14,
					departments: null,
				},
				{
					id: "2026-09-01",
					name: "2026-09-01",
					bucketStart: "2026-09-01",
					bucketEnd: "2026-09-06",
					value: null,
					departments: null,
				},
			],
		});
		expect(view.total).toBe(2);
		expect(view.rows.map((row) => row.value)).toEqual([2, null]);
		expect(inclusiveDays("2026-09-01", "2026-09-01")).toBe(1);
	});
});

describe("active organizers", () => {
	it("counts distinct organizers per group and in the total", () => {
		const facts: DrillDownFacilityFact[] = [
			{ ...facility, activeOrganizerIds: ["o1", "o2"] },
			{ ...facility, id: "b", name: "Harbor", activeOrganizerIds: ["o2"] },
			{ ...facility, id: "c", name: "Quiet" },
		];
		const view = aggregateDrillDownFromFacts({
			facilities: facts,
			measure: "active-organizers",
			slice: "market",
			start: "2026-09-10",
			end: "2026-10-07",
			range: "28d",
		});
		expect(view.kind).toBe("distinct-count");
		expect(view.total).toBe(2);
		expect(view.rows.map((row) => row.value)).toEqual([2]);
	});

	it("cannot be sliced by department", async () => {
		const { getMetricDrillDown } = setup();
		await expect(
			getMetricDrillDown({
				measure: "active-organizers",
				range: "7d",
				slice: "department",
				departments: [],
				timeZone: "America/New_York",
			}),
		).rejects.toBeInstanceOf(InvalidRequestError);
		expect(canSliceDrillDownByDepartment("active-organizers")).toBe(false);
	});
});
