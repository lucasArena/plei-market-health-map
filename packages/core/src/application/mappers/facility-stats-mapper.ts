import { STATS_PERIOD_DAYS } from "@core/application/dtos/facility-detail-dto";
import type {
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
	FacilityStatsView,
	PlayerPeriodView,
	ReservationPeriodView,
	StatsPeriod,
} from "@core/application/dtos/facility-detail-dto.types";
import type {
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityWeeklyCounts,
} from "@core/application/repositories/facility-stats-repository.types";
import { addDays } from "@core/domain";

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
		confirmationRateChangePoints: changePoints(currentConfirmation, previousConfirmation),
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

function changePoints(current: number | null, previous: number | null): number | null {
	if (current === null || previous === null) return null;
	return roundTo(current - previous, 1);
}

function reservationCounts(stats: FacilityReservationStats, period: StatsPeriod) {
	if (period === "week") {
		return {
			start: stats.weekStart,
			end: addDays(stats.weekStart, STATS_PERIOD_DAYS.week - 1),
			played: stats.playedLastWeek,
			playedPrevious: stats.playedPreviousWeek,
			scheduled: stats.scheduledLastWeek,
			scheduledPrevious: stats.scheduledPreviousWeek,
			cancelled: stats.cancelledLastWeek,
			cancelledPrevious: stats.cancelledPreviousWeek,
		};
	}
	return {
		start: stats.periodStart,
		end: stats.periodEnd,
		played: stats.playedLast28Days,
		playedPrevious: stats.playedPrevious28Days,
		scheduled: stats.scheduledLast28Days,
		scheduledPrevious: stats.scheduledPrevious28Days,
		cancelled: stats.cancelledLast28Days,
		cancelledPrevious: stats.cancelledPrevious28Days,
	};
}

export function toReservationPeriodView(
	stats: FacilityReservationStats,
	period: StatsPeriod,
): ReservationPeriodView {
	const {
		start,
		end,
		played,
		playedPrevious,
		scheduled,
		scheduledPrevious,
		cancelled,
		cancelledPrevious,
	} = reservationCounts(stats, period);
	const current = confirmationRate(played, scheduled);
	const previous = confirmationRate(playedPrevious, scheduledPrevious);
	const cancellation = confirmationRate(cancelled, scheduled);
	const cancellationPrevious = confirmationRate(cancelledPrevious, scheduledPrevious);
	return {
		period,
		start,
		end,
		played,
		playedPrevious,
		playedChangePercent: percentChange(played, playedPrevious),
		confirmationRate: current,
		confirmationRatePrevious: previous,
		confirmationRateChangePoints: changePoints(current, previous),
		scheduled,
		scheduledPrevious,
		scheduledChangePercent: percentChange(scheduled, scheduledPrevious),
		cancellationRate: cancellation,
		cancellationRatePrevious: cancellationPrevious,
		cancellationRateChangePoints: changePoints(cancellation, cancellationPrevious),
	};
}

function playerCounts(stats: FacilityPlayerStats, period: StatsPeriod) {
	if (period === "week") {
		return {
			uniquePlayers: stats.uniquePlayersLastWeek,
			uniquePlayersPrevious: stats.uniquePlayersPreviousWeek,
			activatedPlayers: stats.activatedPlayersLastWeek,
			activatedPlayersPrevious: stats.activatedPlayersPreviousWeek,
		};
	}
	return {
		uniquePlayers: stats.uniquePlayersLast28Days,
		uniquePlayersPrevious: stats.uniquePlayersPrevious28Days,
		activatedPlayers: stats.activatedPlayersLast28Days,
		activatedPlayersPrevious: stats.activatedPlayersPrevious28Days,
	};
}

export function toPlayerPeriodView(
	stats: FacilityPlayerStats,
	period: StatsPeriod,
): PlayerPeriodView {
	const counts = playerCounts(stats, period);
	return {
		...counts,
		uniquePlayersChangePercent: percentChange(counts.uniquePlayers, counts.uniquePlayersPrevious),
		activatedPlayersChangePercent: percentChange(
			counts.activatedPlayers,
			counts.activatedPlayersPrevious,
		),
	};
}
