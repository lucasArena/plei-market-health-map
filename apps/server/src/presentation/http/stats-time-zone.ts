import type { Context } from "hono";

export const STATS_TIME_ZONE_PARAM = "tz";

export function statsTimeZoneFrom(context: Context): { timeZone?: string } {
	const timeZone = context.req.query(STATS_TIME_ZONE_PARAM);
	return timeZone === undefined ? {} : { timeZone };
}
