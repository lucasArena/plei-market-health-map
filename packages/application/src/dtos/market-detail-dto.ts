import { z } from "zod";

export const getMarketDetailSchema = z.object({
	marketId: z.string().trim().min(1),
});
