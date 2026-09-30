import type {
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
	FacilityStatsView,
} from "@core/application/dtos/facility-detail-dto.types";
import type {
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityWeeklyCounts,
} from "@core/application/ports/facility-stats-repository.types";

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function percentChange(current: number, previous: number): number | null {
	if (previous <= 0) return null;
	return roundTo(((current - previous) / previous) * 100, 1);
}

function confirmationRate(played: number, scheduled: number): number | null {
	if (scheduled <= 0) return null;
	return roundTo((played / scheduled) * 100, 1);
}

export function toFacilityReservationStatsView(
	counts: FacilityReservationStats,
): FacilityReservationStatsView {
	const {
		playedLastWeek,
		playedPreviousWeek,
		playedLast28Days,
		playedPrevious28Days,
		scheduledLast28Days,
		scheduledPrevious28Days,
		scheduledLastWeek,
		cancelledLastWeek,
	} = counts;
	const currentConfirmation = confirmationRate(playedLast28Days, scheduledLast28Days);
	const previousConfirmation = confirmationRate(playedPrevious28Days, scheduledPrevious28Days);
	return {
		...counts,
		playedChangePercent: percentChange(playedLastWeek, playedPreviousWeek),
		playedPeriodChangePercent: percentChange(playedLast28Days, playedPrevious28Days),
		cancellationRate:
			scheduledLastWeek > 0 ? roundTo((cancelledLastWeek / scheduledLastWeek) * 100, 1) : null,
		confirmationRate: currentConfirmation,
		confirmationRateChangePoints:
			currentConfirmation === null || previousConfirmation === null
				? null
				: roundTo(currentConfirmation - previousConfirmation, 1),
	};
}

export function toFacilityPlayerStatsView(counts: FacilityPlayerStats): FacilityPlayerStatsView {
	const {
		uniquePlayersLast28Days,
		uniquePlayersPrevious28Days,
		activatedPlayersLast28Days,
		activatedPlayersPrevious28Days,
	} = counts;
	return {
		...counts,
		uniquePlayersPeriodChangePercent: percentChange(
			uniquePlayersLast28Days,
			uniquePlayersPrevious28Days,
		),
		activatedPlayersPeriodChangePercent: percentChange(
			activatedPlayersLast28Days,
			activatedPlayersPrevious28Days,
		),
	};
}

export function toFacilityStatsView(counts: FacilityWeeklyCounts): FacilityStatsView {
	return {
		...toFacilityReservationStatsView(counts),
		...toFacilityPlayerStatsView(counts),
	};
}
