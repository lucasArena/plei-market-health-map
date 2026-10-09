import { DRILL_DOWN_COMPARISONS, DRILL_DOWN_RANGES } from "@market-health-map/core/application";
import { z } from "zod";
import { JsonPreference } from "@/infrastructure/cache/local-storage/json-preference/json-preference";

export const DRILL_DOWN_DATES_KEY = "market-health-map:drill-down-dates";

export const drillDownDatesSchema = z.object({
	range: z.enum(DRILL_DOWN_RANGES),
	comparison: z.enum(DRILL_DOWN_COMPARISONS),
});

export const drillDownDatesPreference = new JsonPreference(
	DRILL_DOWN_DATES_KEY,
	drillDownDatesSchema,
);
