import type { FacilityStatsView } from "@core/application/dtos/facility-detail-dto.types";
import type { FacilityWeeklyCounts } from "@core/application/ports/facility-stats-repository.types";

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

export function toFacilityStatsView(counts: FacilityWeeklyCounts): FacilityStatsView {
	const { playedLastWeek, playedPreviousWeek, scheduledLastWeek, cancelledLastWeek } = counts;
	return {
		...counts,
		playedChangePercent:
			playedPreviousWeek > 0
				? roundTo(((playedLastWeek - playedPreviousWeek) / playedPreviousWeek) * 100, 1)
				: null,
		cancellationRate:
			scheduledLastWeek > 0 ? roundTo((cancelledLastWeek / scheduledLastWeek) * 100, 1) : null,
	};
}
