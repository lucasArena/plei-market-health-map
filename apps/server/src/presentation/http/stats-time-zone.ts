import type { Context } from "hono";

/** The query parameter the browser fills with its IANA time zone for every period request. */
export const STATS_TIME_ZONE_PARAM = "tz";

/** `?tz=` as sent; core validates it and falls back to the default zone when it is unknown. */
export function statsTimeZoneFrom(context: Context): { timeZone?: string } {
	const timeZone = context.req.query(STATS_TIME_ZONE_PARAM);
	return timeZone === undefined ? {} : { timeZone };
}
