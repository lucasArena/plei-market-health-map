import type { z } from "zod";
import type { drillDownDatesSchema } from "@/infrastructure/cache/local-storage/drill-down-dates/drill-down-dates-preference";

export type DrillDownDatesPreferenceValue = z.infer<typeof drillDownDatesSchema>;
