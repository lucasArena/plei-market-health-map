import { statsTimeZoneSchema } from "@core/application/dtos/facility-detail-dto";
import { z } from "zod";

export const getMarketAudienceSchema = z.object({
	market: z.string().trim().min(1).max(64).optional(),
	timeZone: statsTimeZoneSchema,
});
