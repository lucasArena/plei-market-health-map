import type {
	MetricDrillDownRow,
	MetricDrillDownView,
} from "@core/application/dtos/metric-drill-down-dto.types";
import type { GameDepartment } from "@core/domain";

const DAY_MS = 86_400_000;

export function inclusiveDays(start: string, end: string): number {
	const span = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
	return Math.max(1, Math.round(span / DAY_MS) + 1);
}

function perDay(value: number | null, days: number): number | null {
	return value === null ? null : Math.round((value / days) * 10) / 10;
}

function departmentsPerDay(
	departments: Record<GameDepartment, number | null> | null,
	days: number,
): Record<GameDepartment, number | null> | null {
	if (!departments) return null;
	return {
		magic: perDay(departments.magic, days),
		organizers: perDay(departments.organizers, days),
		partnerships: perDay(departments.partnerships, days),
	};
}

function rowPerDay(row: MetricDrillDownRow, fallbackDays: number): MetricDrillDownRow {
	const days =
		row.bucketStart && row.bucketEnd ? inclusiveDays(row.bucketStart, row.bucketEnd) : fallbackDays;
	return {
		...row,
		value: perDay(row.value, days),
		departments: departmentsPerDay(row.departments, days),
		organizers: row.organizers?.map((organizer) => ({
			...organizer,
			value: perDay(organizer.value, days),
			previousValue:
				organizer.previousValue === undefined ? undefined : perDay(organizer.previousValue, days),
		})),
	};
}

export function toAverageDailyGamesView(view: MetricDrillDownView): MetricDrillDownView {
	const days = inclusiveDays(view.start, view.end);
	return {
		...view,
		measure: "avg-daily-games",
		total: perDay(view.total, days),
		rows: view.rows.map((row) => rowPerDay(row, days)),
	};
}
