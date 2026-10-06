import { z } from "zod";

export const STATS_PERIODS = ["week", "month"] as const;
export const DEFAULT_STATS_PERIOD = "week";

export const getFacilityDetailSchema = z.object({
	facilityId: z.string().trim().min(1),
});
