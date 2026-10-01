import { z } from "zod";

export const FEATURE_FLAG_KEYS = ["app-session-demographics"] as const satisfies readonly string[];

export const setFeatureFlagSchema = z.object({
	key: z.string().trim().min(1),
	enabled: z.boolean(),
	updatedBy: z.string().trim().min(1),
});
