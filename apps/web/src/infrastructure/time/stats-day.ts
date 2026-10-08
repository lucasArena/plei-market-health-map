import { DEFAULT_STATS_TIME_ZONE, localDay } from "@market-health-map/core/domain";

export const STATS_TIME_ZONE_PARAM = "tz";

export function browserTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_STATS_TIME_ZONE;
	} catch {
		return DEFAULT_STATS_TIME_ZONE;
	}
}

export function statsDayKey(now: Date = new Date()): string {
	const timeZone = browserTimeZone();
	return `${timeZone}|${localDay(now, timeZone)}`;
}

export function withStatsTimeZone(path: string): string {
	const separator = path.includes("?") ? "&" : "?";
	return `${path}${separator}${STATS_TIME_ZONE_PARAM}=${encodeURIComponent(browserTimeZone())}`;
}
