import type { Clock } from "@core/application/providers/clock.types";
import { localDay, resolveStatsTimeZone } from "@core/domain";

export function statsToday(clock: Clock, timeZone?: string | null): string {
	return localDay(clock.now(), resolveStatsTimeZone(timeZone));
}
