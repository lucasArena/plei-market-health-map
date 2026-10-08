import type { Clock } from "@core/application/providers/clock.types";
import { localDay, resolveStatsTimeZone } from "@core/domain";

/**
 * Today (YYYY-MM-DD) in the viewer's time zone. Every stats window ends the day before, so the
 * map, panel, insights and heatmap all cut at the same local midnight.
 */
export function statsToday(clock: Clock, timeZone?: string | null): string {
	return localDay(clock.now(), resolveStatsTimeZone(timeZone));
}
