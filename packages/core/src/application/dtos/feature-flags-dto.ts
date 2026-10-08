import { z } from "zod";

export const FEATURE_FLAG_KEYS = [
	"metric-drill-down",
	"player-demographic-filters",
	"facility-games-layer",
	"facility-games-trend",
] as const satisfies readonly string[];

/**
 * A flag listed here only takes effect while the flag it requires is on too, so its effective
 * value is both flags ANDed. Admins can still switch it while its requirement is off.
 */
export const FEATURE_FLAG_REQUIREMENTS: Readonly<Record<string, string>> = {
	"facility-games-trend": "facility-games-layer",
};

export const setFeatureFlagSchema = z.object({
	key: z.string().trim().min(1),
	enabled: z.boolean(),
	updatedBy: z.string().trim().min(1),
});
