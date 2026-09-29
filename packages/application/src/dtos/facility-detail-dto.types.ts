import type { getFacilityDetailSchema } from "@application/dtos/facility-detail-dto";
import type { FacilityPointView } from "@application/dtos/facility-dto.types";
import type { FacilityWeeklyCounts } from "@application/ports/facility-stats-repository.types";
import type { z } from "zod";

export type GetFacilityDetailInput = z.infer<typeof getFacilityDetailSchema>;

export interface FacilityStatsView extends FacilityWeeklyCounts {
	playedChangePercent: number | null;
	cancellationRate: number | null;
}

export interface FacilityDetailView {
	facility: FacilityPointView & { address: string };
	stats: FacilityStatsView;
}
