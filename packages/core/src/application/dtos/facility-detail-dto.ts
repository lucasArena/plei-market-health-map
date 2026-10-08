import { GAMES_WINDOW_DAYS } from "@core/domain";
import { z } from "zod";

export const STATS_PERIODS = ["week", "month"] as const;
export const DEFAULT_STATS_PERIOD = "week";

/** Days in each period: the full days ending yesterday in the viewer's time zone, never today. */
export const STATS_PERIOD_DAYS = { week: 7, month: GAMES_WINDOW_DAYS } as const;

/** The viewer's IANA time zone; a missing or unknown zone falls back to the default, never an error. */
export const statsTimeZoneSchema = z.string().optional();

export const getFacilityDetailSchema = z.object({
	facilityId: z.string().trim().min(1),
	timeZone: statsTimeZoneSchema,
});
