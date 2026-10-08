import { STATS_PERIOD_DAYS } from "@market-health-map/core/application";

/** Days in the 7D window. */
export const WEEK_DAYS = STATS_PERIOD_DAYS.week;

/** Days in the 28D window. */
export const MONTH_DAYS = STATS_PERIOD_DAYS.month;

/**
 * The viewer's today as a bound query parameter (`$n::date`). It comes from the browser's time
 * zone through `statsToday`, never from the warehouse session (UTC) or a fixed zone, so the map,
 * the panel, the insights and the heatmap all cut at the viewer's local midnight. `date_with_time`
 * is the game's local wall-clock time, so its date compares directly.
 */
export function todayParameterSql(position: number): string {
	return `$${position}::date`;
}

/** `column` falls in the `days` full days ending the day before `today`; today is never included. */
export function inLastDaysSql(column: string, today: string, days: number): string {
	return `${column} >= ${today} - ${days} and ${column} < ${today}`;
}

/** `column` falls in the `days` full days just before `inLastDaysSql`'s window. */
export function inPreviousDaysSql(column: string, today: string, days: number): string {
	return `${column} >= ${today} - ${days * 2} and ${column} < ${today} - ${days}`;
}
