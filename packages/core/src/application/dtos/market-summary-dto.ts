import { STATS_PERIODS, statsTimeZoneSchema } from "@core/application/dtos/facility-detail-dto";
import { GAME_DEPARTMENTS, normalizeGameDepartments } from "@core/domain";
import { z } from "zod";

export const gameDepartmentsSchema = z
	.array(z.enum(GAME_DEPARTMENTS))
	.max(GAME_DEPARTMENTS.length * 2)
	.optional()
	.transform(normalizeGameDepartments);

export const getMarketPlayerStatsSchema = z.object({
	market: z.string().trim().min(1).max(64).optional(),
	timeZone: statsTimeZoneSchema,
});

export const getMarketSummarySchema = getMarketPlayerStatsSchema.extend({
	departments: gameDepartmentsSchema,
});

export const getMarketGameInsightsSchema = getMarketSummarySchema.extend({
	period: z.enum(STATS_PERIODS).default("week"),
});
