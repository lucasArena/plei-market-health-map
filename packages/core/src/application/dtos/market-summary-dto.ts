import { z } from "zod";

export const getMarketSummarySchema = z.object({
	market: z.string().trim().min(1).max(64).optional(),
});
