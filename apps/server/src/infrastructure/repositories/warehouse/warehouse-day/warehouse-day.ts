import { STATS_PERIOD_DAYS } from "@market-health-map/core/application";

export const WEEK_DAYS = STATS_PERIOD_DAYS.week;

export const MONTH_DAYS = STATS_PERIOD_DAYS.month;

export function todayParameterSql(position: number): string {
	return `$${position}::date`;
}

export function inLastDaysSql(column: string, today: string, days: number): string {
	return `${column} >= ${today} - ${days} and ${column} < ${today}`;
}

export function inPreviousDaysSql(column: string, today: string, days: number): string {
	return `${column} >= ${today} - ${days * 2} and ${column} < ${today} - ${days}`;
}

export function inDaysWindowSql(
	column: string,
	today: string,
	days: number,
	windowsAgo: number,
): string {
	if (windowsAgo === 0) return inLastDaysSql(column, today, days);
	return `${column} >= ${today} - ${days * (windowsAgo + 1)} and ${column} < ${today} - ${days * windowsAgo}`;
}
