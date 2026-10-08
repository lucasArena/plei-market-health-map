import {
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_RANGE_DAYS,
} from "@core/application/dtos/metric-drill-down-dto";
import type {
	DrillDownMeasure,
	DrillDownSlice,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import { confirmationRate } from "@core/application/mappers/facility-stats-mapper";
import type {
	AggregateCountDrillDownInput,
	DistinctCountContribution,
	DrillDownFacilityFact,
	RateContribution,
} from "@core/application/services/aggregate-metric-drill-down.types";
import type { GameDepartment, GameDepartmentCounts } from "@core/domain";
import { localDay, statsWindow } from "@core/domain";

export type {
	AggregateCountDrillDownInput,
	DistinctCountContribution,
	DrillDownFacilityFact,
	RateContribution,
} from "@core/application/services/aggregate-metric-drill-down.types";

export const DRILL_DOWN_DEPARTMENTS = ["magic", "organizers", "partnerships"] as const;

export function drillDownRangeDays(range: MetricDrillDownView["range"]): number {
	return DRILL_DOWN_RANGE_DAYS[range];
}

export function drillDownWindow(
	now: Date,
	timeZone: string,
	range: MetricDrillDownView["range"],
): { start: string; end: string } {
	const { start, end } = statsWindow(localDay(now, timeZone), drillDownRangeDays(range));
	return { start, end };
}

function sumKnown(left: number | null, right: number | null): number | null {
	if (left === null || right === null) return null;
	return left + right;
}

function emptyDepartments(): Record<GameDepartment, number | null> {
	return { magic: 0, organizers: 0, partnerships: 0 };
}

function scopedFacilities(
	facilities: readonly DrillDownFacilityFact[],
	marketId?: string,
	facilityId?: string,
): DrillDownFacilityFact[] {
	return [...new Map(facilities.map((facility) => [facility.id, facility])).values()].filter(
		(facility) =>
			(!marketId || facility.marketId === marketId) && (!facilityId || facility.id === facilityId),
	);
}

export function aggregateCountDrillDown(input: AggregateCountDrillDownInput): MetricDrillDownView {
	const facilities = scopedFacilities(input.facilities, input.marketId, input.facilityId);
	const rows = new Map<string, MetricDrillDownRow>();
	let total: number | null = 0;
	const selectedDepartments = input.gameDepartments?.length
		? input.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	for (const facility of facilities) {
		const departments = facility.gamesByDepartment ? { ...facility.gamesByDepartment } : undefined;
		if (departments)
			for (const department of DRILL_DOWN_DEPARTMENTS)
				if (!selectedDepartments.includes(department)) departments[department] = 0;
		const filteredGames = departments
			? selectedDepartments.reduce((sum, department) => sum + departments[department], 0)
			: null;
		if (input.gameDepartments?.length && filteredGames === 0) continue;
		let value: number | null = input.gameDepartments?.length ? filteredGames : facility.games;
		if (input.department) value = departments?.[input.department] ?? null;
		if (input.measure === "active-facilities")
			value =
				input.gameDepartments?.length && filteredGames === null
					? null
					: Number((filteredGames ?? facility.games ?? 0) > 0);
		total = sumKnown(total, value);
		const groups =
			input.slice === "department"
				? selectedDepartments
				: [input.slice === "market" ? facility.marketId : facility.id];
		for (const id of groups) {
			const isDepartment = input.slice === "department";
			const name = { market: facility.marketName, facility: facility.name, department: id }[
				input.slice
			];
			const row = rows.get(id) ?? { id, name, value: 0, departments: emptyDepartments() };
			const groupValue = isDepartment ? (departments?.[id as GameDepartment] ?? null) : value;
			row.value = sumKnown(row.value, groupValue);
			if (!departments || !row.departments) row.departments = null;
			else
				for (const department of DRILL_DOWN_DEPARTMENTS)
					row.departments[department] =
						(row.departments[department] ?? 0) + departments[department];
			rows.set(id, row);
		}
	}
	return {
		total,
		rows: [...rows.values()],
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: DRILL_DOWN_MEASURE_KIND[input.measure],
	};
}

function emptyDepartmentKeys(): Record<GameDepartment, Set<string>> {
	return { magic: new Set(), organizers: new Set(), partnerships: new Set() };
}

export function aggregateDistinctCountDrillDown(input: {
	contributions: readonly DistinctCountContribution[];
	sliceKeys: (contribution: DistinctCountContribution) => readonly { id: string; name: string }[];
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	measure: DrillDownMeasure;
	range: MetricDrillDownView["range"];
	start: string;
	end: string;
}): MetricDrillDownView {
	const selectedDepartments = input.gameDepartments?.length
		? input.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	const rows = new Map<
		string,
		{
			id: string;
			name: string;
			keys: Set<string>;
			departmentKeys: Record<GameDepartment, Set<string>>;
		}
	>();
	const totalKeys = new Set<string>();
	for (const contribution of input.contributions) {
		const keys = input.department
			? (contribution.departments?.[input.department] ?? [])
			: contribution.memberKeys;
		for (const key of keys) totalKeys.add(key);
		for (const group of input.sliceKeys(contribution)) {
			const row = rows.get(group.id) ?? {
				id: group.id,
				name: group.name,
				keys: new Set<string>(),
				departmentKeys: emptyDepartmentKeys(),
			};
			for (const key of keys) row.keys.add(key);
			for (const department of selectedDepartments) {
				for (const key of contribution.departments?.[department] ?? [])
					row.departmentKeys[department].add(key);
			}
			rows.set(group.id, row);
		}
	}
	return {
		total: totalKeys.size,
		rows: [...rows.values()].map((row) => ({
			id: row.id,
			name: row.name,
			value: row.keys.size,
			departments: {
				magic: row.departmentKeys.magic.size,
				organizers: row.departmentKeys.organizers.size,
				partnerships: row.departmentKeys.partnerships.size,
			},
		})),
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: "distinct-count",
	};
}

export function rateValue(numerator: number | null, denominator: number | null): number | null {
	if (numerator === null || denominator === null || denominator === 0) return null;
	return numerator / denominator;
}

export function measureRateValue(
	measure: DrillDownMeasure,
	numerator: number | null,
	denominator: number | null,
): number | null {
	if (numerator === null || denominator === null) return null;
	if (measure === "confirmation-rate") return confirmationRate(numerator, denominator);
	return rateValue(numerator, denominator);
}

export function aggregateRateDrillDown(input: {
	contributions: readonly RateContribution[];
	department?: GameDepartment;
	gameDepartments?: readonly GameDepartment[];
	measure: DrillDownMeasure;
	range: MetricDrillDownView["range"];
	start: string;
	end: string;
}): MetricDrillDownView {
	const selectedDepartments = input.gameDepartments?.length
		? input.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	const rows = new Map<
		string,
		{
			id: string;
			name: string;
			numerator: number | null;
			denominator: number | null;
			departments: Record<GameDepartment, { numerator: number | null; denominator: number | null }>;
		}
	>();
	let totalNumerator: number | null = 0;
	let totalDenominator: number | null = 0;
	for (const contribution of input.contributions) {
		const parts = input.department
			? (contribution.departments?.[input.department] ?? {
					numerator: null,
					denominator: null,
				})
			: contribution;
		totalNumerator = sumKnown(totalNumerator, parts.numerator);
		totalDenominator = sumKnown(totalDenominator, parts.denominator);
		const row = rows.get(contribution.id) ?? {
			id: contribution.id,
			name: contribution.name,
			numerator: 0,
			denominator: 0,
			departments: {
				magic: { numerator: 0, denominator: 0 },
				organizers: { numerator: 0, denominator: 0 },
				partnerships: { numerator: 0, denominator: 0 },
			},
		};
		row.numerator = sumKnown(row.numerator, parts.numerator);
		row.denominator = sumKnown(row.denominator, parts.denominator);
		for (const department of selectedDepartments) {
			const departmentParts = contribution.departments?.[department] ?? {
				numerator: null,
				denominator: null,
			};
			row.departments[department] = {
				numerator: sumKnown(row.departments[department].numerator, departmentParts.numerator),
				denominator: sumKnown(row.departments[department].denominator, departmentParts.denominator),
			};
		}
		rows.set(contribution.id, row);
	}
	return {
		total: measureRateValue(input.measure, totalNumerator, totalDenominator),
		rows: [...rows.values()].map((row) => ({
			id: row.id,
			name: row.name,
			value: measureRateValue(input.measure, row.numerator, row.denominator),
			numerator: row.numerator,
			denominator: row.denominator,
			departments: {
				magic: measureRateValue(
					input.measure,
					row.departments.magic.numerator,
					row.departments.magic.denominator,
				),
				organizers: measureRateValue(
					input.measure,
					row.departments.organizers.numerator,
					row.departments.organizers.denominator,
				),
				partnerships: measureRateValue(
					input.measure,
					row.departments.partnerships.numerator,
					row.departments.partnerships.denominator,
				),
			},
		})),
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: "rate",
	};
}

export function scheduledFactsFrom(
	facilities: readonly DrillDownFacilityFact[],
): DrillDownFacilityFact[] {
	return facilities.map((facility) => ({
		...facility,
		games: facility.scheduled ?? facility.games,
		gamesByDepartment: facility.scheduledByDepartment ?? facility.gamesByDepartment,
	}));
}

export function rateContributionsFromFacts(
	facilities: readonly DrillDownFacilityFact[],
	slice: DrillDownSlice,
	options: {
		marketId?: string;
		facilityId?: string;
		gameDepartments?: readonly GameDepartment[];
	} = {},
): RateContribution[] {
	const selectedDepartments = options.gameDepartments?.length
		? options.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	return scopedFacilities(facilities, options.marketId, options.facilityId).flatMap(
		(facility): RateContribution[] => {
			const departments =
				facility.gamesByDepartment && facility.scheduledByDepartment
					? {
							magic: {
								numerator: facility.gamesByDepartment.magic,
								denominator: facility.scheduledByDepartment.magic,
							},
							organizers: {
								numerator: facility.gamesByDepartment.organizers,
								denominator: facility.scheduledByDepartment.organizers,
							},
							partnerships: {
								numerator: facility.gamesByDepartment.partnerships,
								denominator: facility.scheduledByDepartment.partnerships,
							},
						}
					: null;
			if (slice === "department")
				return selectedDepartments.map((department) => ({
					id: department,
					name: department,
					numerator: departments?.[department].numerator ?? null,
					denominator: departments?.[department].denominator ?? null,
				}));
			return [
				{
					id: slice === "market" ? facility.marketId : facility.id,
					name: slice === "market" ? facility.marketName : facility.name,
					numerator: facility.games,
					denominator: facility.scheduled ?? null,
					departments,
				},
			];
		},
	);
}

export function distinctContributionsFromFacts(
	facilities: readonly DrillDownFacilityFact[],
	slice: DrillDownSlice,
	measure: Extract<DrillDownMeasure, "unique-players" | "activated-players">,
	options: {
		marketId?: string;
		facilityId?: string;
		gameDepartments?: readonly GameDepartment[];
	} = {},
): DistinctCountContribution[] {
	const selectedDepartments = options.gameDepartments?.length
		? options.gameDepartments
		: DRILL_DOWN_DEPARTMENTS;
	return scopedFacilities(facilities, options.marketId, options.facilityId).flatMap(
		(facility): DistinctCountContribution[] => {
			const memberKeys =
				(measure === "unique-players" ? facility.uniquePlayerIds : facility.activatedPlayerIds) ??
				[];
			const source =
				measure === "unique-players"
					? facility.uniquePlayerIdsByDepartment
					: facility.activatedPlayerIdsByDepartment;
			const departments = {
				magic: source?.magic ?? [],
				organizers: source?.organizers ?? [],
				partnerships: source?.partnerships ?? [],
			};
			if (slice === "department")
				return selectedDepartments.map((department) => ({
					id: department,
					name: department,
					memberKeys: departments[department],
				}));
			return [
				{
					id: slice === "market" ? facility.marketId : facility.id,
					name: slice === "market" ? facility.marketName : facility.name,
					memberKeys,
					departments,
				},
			];
		},
	);
}

export function aggregateDrillDownFromFacts(
	input: AggregateCountDrillDownInput,
): MetricDrillDownView {
	if (input.measure === "confirmation-rate")
		return aggregateRateDrillDown({
			contributions: rateContributionsFromFacts(input.facilities, input.slice, input),
			department: input.department,
			gameDepartments: input.gameDepartments,
			measure: input.measure,
			range: input.range,
			start: input.start,
			end: input.end,
		});
	if (input.measure === "unique-players" || input.measure === "activated-players")
		return aggregateDistinctCountDrillDown({
			contributions: distinctContributionsFromFacts(
				input.facilities,
				input.slice,
				input.measure,
				input,
			),
			sliceKeys: (contribution) => [{ id: contribution.id, name: contribution.name }],
			department: input.department,
			gameDepartments: input.gameDepartments,
			measure: input.measure,
			range: input.range,
			start: input.start,
			end: input.end,
		});
	return aggregateCountDrillDown({
		...input,
		facilities:
			input.measure === "scheduled-games" ? scheduledFactsFrom(input.facilities) : input.facilities,
	});
}

export function factsFromFacilityPoints(
	facilities: readonly {
		id: string;
		name: string;
		marketId: string;
		marketName: string;
		gamesLast28Days?: number;
		gamesLastWeek?: number;
		gamesByDepartment?: GameDepartmentCounts;
		gamesLastWeekByDepartment?: GameDepartmentCounts;
	}[],
	range: MetricDrillDownView["range"],
): DrillDownFacilityFact[] {
	const useWeek = range === "7d";
	return facilities.map((facility) => ({
		id: facility.id,
		name: facility.name,
		marketId: facility.marketId,
		marketName: facility.marketName,
		games: useWeek ? (facility.gamesLastWeek ?? null) : (facility.gamesLast28Days ?? null),
		gamesByDepartment: useWeek
			? (facility.gamesLastWeekByDepartment ?? null)
			: (facility.gamesByDepartment ?? null),
	}));
}
