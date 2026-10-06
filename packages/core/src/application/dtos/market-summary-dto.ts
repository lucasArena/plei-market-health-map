import { STATS_PERIODS } from "@core/application/dtos/facility-detail-dto";
import { z } from "zod";

export const getMarketSummarySchema = z.object({
	market: z.string().trim().min(1).max(64).optional(),
});

export const getMarketGameInsightsSchema = getMarketSummarySchema.extend({
	period: z.enum(STATS_PERIODS).default("week"),
});
