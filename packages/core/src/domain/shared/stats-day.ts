import { addDays } from "@core/domain/shared/eastern-calendar";

export const DEFAULT_STATS_TIME_ZONE = "America/New_York";

const MAX_TIME_ZONE_LENGTH = 64;

export function resolveStatsTimeZone(timeZone: string | null | undefined): string {
	const candidate = timeZone?.trim();
	if (!candidate || candidate.length > MAX_TIME_ZONE_LENGTH) return DEFAULT_STATS_TIME_ZONE;
	try {
		return new Intl.DateTimeFormat("en-US", { timeZone: candidate }).resolvedOptions().timeZone;
	} catch {
		return DEFAULT_STATS_TIME_ZONE;
	}
}

export function localDay(now: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: resolveStatsTimeZone(timeZone),
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(now);
}

export interface StatsWindow {
	start: string;
	end: string;
	previousStart: string;
	previousEnd: string;
}

export function statsWindow(today: string, days: number): StatsWindow {
	return {
		start: addDays(today, -days),
		end: addDays(today, -1),
		previousStart: addDays(today, -2 * days),
		previousEnd: addDays(today, -days - 1),
	};
}
