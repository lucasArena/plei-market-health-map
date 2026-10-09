import type { DrillDownComparison } from "@core/application/dtos/metric-drill-down-dto.types";
import { addDays } from "@core/domain/shared/eastern-calendar";
import { statsWindow } from "@core/domain/shared/stats-day";

export function drillDownComparisonWindow(
	today: string,
	days: number,
	comparison: DrillDownComparison,
) {
	const current = statsWindow(today, days);
	if (comparison === "previous-period") return statsWindow(current.start, days);
	if (comparison === "week") return statsWindow(addDays(today, -7), days);
	const end = new Date(`${current.end}T00:00:00Z`);
	const day = end.getUTCDate();
	end.setUTCDate(1);
	end.setUTCMonth(end.getUTCMonth() - (comparison === "month" ? 1 : 12));
	const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
	end.setUTCDate(Math.min(day, lastDay));
	return statsWindow(addDays(end.toISOString().slice(0, 10), 1), days);
}
