import { GAMES_WINDOW_DAYS } from "@core/domain";
import { z } from "zod";

export const STATS_PERIODS = ["week", "month"] as const;
export const DEFAULT_STATS_PERIOD = "week";

export const STATS_PERIOD_DAYS = { week: 7, month: GAMES_WINDOW_DAYS } as const;

export const statsTimeZoneSchema = z.string().optional();

export const getFacilityDetailSchema = z.object({
	facilityId: z.string().trim().min(1),
	timeZone: statsTimeZoneSchema,
});
