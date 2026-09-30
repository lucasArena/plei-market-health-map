import type { getFacilityDetailSchema } from "@core/application/dtos/facility-detail-dto";
import type { FacilityPointView } from "@core/application/dtos/facility-dto.types";
import type {
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityWeeklyCounts,
} from "@core/application/ports/facility-stats-repository.types";
import type { z } from "zod";

export type GetFacilityDetailInput = z.infer<typeof getFacilityDetailSchema>;

export interface FacilityReservationStatsView extends FacilityReservationStats {
	playedChangePercent: number | null;
	playedPeriodChangePercent: number | null;
	cancellationRate: number | null;
	confirmationRate: number | null;
	confirmationRateChangePoints: number | null;
}

export interface FacilityPlayerStatsView extends FacilityPlayerStats {
	uniquePlayersPeriodChangePercent: number | null;
	activatedPlayersPeriodChangePercent: number | null;
}

export interface FacilityStatsView
	extends FacilityWeeklyCounts,
		FacilityReservationStatsView,
		FacilityPlayerStatsView {}

export type GetFacilityReservationStatsInput = GetFacilityDetailInput;

export type GetFacilityPlayerStatsInput = GetFacilityDetailInput;

export interface FacilityReservationDetailView {
	facility: FacilityPointView & { address: string };
	stats: FacilityReservationStatsView;
}

export interface FacilityDetailView {
	facility: FacilityPointView & { address: string };
	stats: FacilityStatsView;
}
