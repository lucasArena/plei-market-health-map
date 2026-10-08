import {
	DRILL_DOWN_MEASURE_KIND,
	DRILL_DOWN_RANGE_DAYS,
} from "@core/application/dtos/metric-drill-down-dto";
import type {
	DrillDownMeasure,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
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

function emptyDepartments(): GameDepartmentCounts {
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
					row.departments[department] += departments[department];
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

export function aggregateDistinctCountDrillDown(input: {
	contributions: readonly DistinctCountContribution[];
	sliceKeys: (contribution: DistinctCountContribution) => readonly { id: string; name: string }[];
	department?: GameDepartment;
	measure: DrillDownMeasure;
	range: MetricDrillDownView["range"];
	start: string;
	end: string;
}): MetricDrillDownView {
	const rows = new Map<string, { id: string; name: string; keys: Set<string> }>();
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
			};
			for (const key of keys) row.keys.add(key);
			rows.set(group.id, row);
		}
	}
	return {
		total: totalKeys.size,
		rows: [...rows.values()].map((row) => ({
			id: row.id,
			name: row.name,
			value: row.keys.size,
			departments: null,
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

export function aggregateRateDrillDown(input: {
	contributions: readonly RateContribution[];
	department?: GameDepartment;
	measure: DrillDownMeasure;
	range: MetricDrillDownView["range"];
	start: string;
	end: string;
}): MetricDrillDownView {
	const rows = new Map<
		string,
		{ id: string; name: string; numerator: number | null; denominator: number | null }
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
		};
		row.numerator = sumKnown(row.numerator, parts.numerator);
		row.denominator = sumKnown(row.denominator, parts.denominator);
		rows.set(contribution.id, row);
	}
	return {
		total: rateValue(totalNumerator, totalDenominator),
		rows: [...rows.values()].map((row) => ({
			id: row.id,
			name: row.name,
			value: rateValue(row.numerator, row.denominator),
			numerator: row.numerator,
			denominator: row.denominator,
			departments: null,
		})),
		start: input.start,
		end: input.end,
		measure: input.measure,
		range: input.range,
		kind: "rate",
	};
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
