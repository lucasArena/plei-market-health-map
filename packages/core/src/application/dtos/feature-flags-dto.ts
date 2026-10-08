import { z } from "zod";

export const FEATURE_FLAG_KEYS = [
	"player-demographic-filters",
	"facility-games-layer",
	"facility-games-trend",
] as const satisfies readonly string[];

export const FEATURE_FLAG_REQUIREMENTS: Readonly<Record<string, string>> = {
	"facility-games-trend": "facility-games-layer",
};

export const setFeatureFlagSchema = z.object({
	key: z.string().trim().min(1),
	enabled: z.boolean(),
	updatedBy: z.string().trim().min(1),
});
