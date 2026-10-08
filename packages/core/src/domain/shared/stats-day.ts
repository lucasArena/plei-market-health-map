import { addDays } from "@core/domain/shared/eastern-calendar";

/** Used when the browser sends no time zone, or one the runtime does not know. */
export const DEFAULT_STATS_TIME_ZONE = "America/New_York";

const MAX_TIME_ZONE_LENGTH = 64;

/** The viewer's IANA time zone when it is a real one, otherwise `DEFAULT_STATS_TIME_ZONE`. */
export function resolveStatsTimeZone(timeZone: string | null | undefined): string {
	const candidate = timeZone?.trim();
	if (!candidate || candidate.length > MAX_TIME_ZONE_LENGTH) return DEFAULT_STATS_TIME_ZONE;
	try {
		return new Intl.DateTimeFormat("en-US", { timeZone: candidate }).resolvedOptions().timeZone;
	} catch {
		return DEFAULT_STATS_TIME_ZONE;
	}
}

/** The calendar date (YYYY-MM-DD) at `now` in `timeZone`. */
export function localDay(now: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: resolveStatsTimeZone(timeZone),
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);
}

/** Inclusive date range (YYYY-MM-DD) of one stats window and of the equal window just before it. */
export interface StatsWindow {
	start: string;
	end: string;
	previousStart: string;
	previousEnd: string;
}

/**
 * The `days` full days ending yesterday, never today: on Oct 8 a 7 day window is Oct 1 to Oct 7
 * and its previous window Sep 24 to Sep 30.
 */
export function statsWindow(today: string, days: number): StatsWindow {
	return {
		start: addDays(today, -days),
		end: addDays(today, -1),
		previousStart: addDays(today, -2 * days),
		previousEnd: addDays(today, -days - 1),
	};
}
