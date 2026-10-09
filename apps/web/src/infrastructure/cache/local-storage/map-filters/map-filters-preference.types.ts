import type { z } from "zod";
import type { mapFiltersSchema } from "@/infrastructure/cache/local-storage/map-filters/map-filters-preference";

export type MapFiltersPreferenceValue = z.infer<typeof mapFiltersSchema>;
