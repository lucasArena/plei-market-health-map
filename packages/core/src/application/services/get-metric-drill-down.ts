import type {
	MetricDrillDownInput,
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/services/get-metric-drill-down.types";
import type { GameDepartment, GameDepartmentCounts } from "@core/domain";
import { lastCompletedWeekStart } from "@core/domain";

export const DRILL_DOWN_DEPARTMENTS = ["magic", "organizers", "partnerships"] as const;

function sumKnown(left: number | null, right: number | null): number | null {
	if (left === null || right === null) return null;
	return left + right;
}
function emptyDepartments(): GameDepartmentCounts {
	return { magic: 0, organizers: 0, partnerships: 0 };
}
function shiftDate(date: string, days: number): string {
	return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export function makeGetMetricDrillDown() {
	return (input: MetricDrillDownInput): MetricDrillDownView => {
		const today = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Pacific/Honolulu",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(input.now);
		const start =
			input.period === "week"
				? lastCompletedWeekStart(new Date(`${today}T00:00:00Z`))
				: shiftDate(today, -28);
		const end = input.period === "week" ? shiftDate(start, 6) : shiftDate(today, -1);
		const facilities = [
			...new Map(input.facilities.map((facility) => [facility.id, facility])).values(),
		].filter(
			(facility) =>
				(!input.marketId || facility.marketId === input.marketId) &&
				(!input.facilityId || facility.id === input.facilityId),
		);
		const rows = new Map<string, MetricDrillDownRow>();
		let total: number | null = 0;
		for (const facility of facilities) {
			const games = input.period === "week" ? facility.gamesLastWeek : facility.gamesLast28Days;
			const departments =
				input.period === "week" ? facility.gamesLastWeekByDepartment : facility.gamesByDepartment;
			let value: number | null = games ?? null;
			if (input.department) value = departments?.[input.department] ?? null;
			if (input.measure === "active-facilities")
				value = Number(input.period === "week" ? facility.isActiveLastWeek : facility.isActive);
			total = sumKnown(total, value);
			const groups =
				input.slice === "department"
					? DRILL_DOWN_DEPARTMENTS
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
		return { total, rows: [...rows.values()], start, end };
	};
}
