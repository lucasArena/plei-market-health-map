import { DEFAULT_STATS_TIME_ZONE, localDay } from "@market-health-map/core/domain";

/** The query parameter every period request carries; the server reads today from it. */
export const STATS_TIME_ZONE_PARAM = "tz";

/** The browser's IANA time zone, or the app default when the browser does not report one. */
export function browserTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_STATS_TIME_ZONE;
	} catch {
		return DEFAULT_STATS_TIME_ZONE;
	}
}

/**
 * The query key part for anything that depends on the 7D or 28D window: the zone and the local
 * date. Keys roll over at local midnight and two zones never share a cached result.
 */
export function statsDayKey(now: Date = new Date()): string {
	const timeZone = browserTimeZone();
	return `${timeZone}|${localDay(now, timeZone)}`;
}

/** Adds `tz=` so the server ends every window the day before the viewer's local today. */
export function withStatsTimeZone(path: string): string {
	const separator = path.includes("?") ? "&" : "?";
	return `${path}${separator}${STATS_TIME_ZONE_PARAM}=${encodeURIComponent(browserTimeZone())}`;
}
