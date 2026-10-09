import { z } from "zod";

export const FEATURE_FLAG_KEYS = ["insights-panel-v3"] as const satisfies readonly string[];

export const FEATURE_FLAG_REQUIREMENTS: Readonly<Record<string, string>> = {};

export const setFeatureFlagSchema = z.object({
	key: z.string().trim().min(1),
	enabled: z.boolean(),
	updatedBy: z.string().trim().min(1),
});
