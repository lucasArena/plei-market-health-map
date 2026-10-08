import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type { MarketGameChangeView } from "@core/application/dtos/market-summary-dto.types";
import type { FacilityGameComparison } from "@core/application/repositories/facility-stats-repository.types";
import { type Facility, type GameDepartment, sumGameDepartments } from "@core/domain";

function currentGames(row: FacilityGameComparison | undefined, period: StatsPeriod): number {
	if (!row) return 0;
	return period === "week" ? row.playedLastWeek : row.playedLast28Days;
}

function previousGames(row: FacilityGameComparison | undefined, period: StatsPeriod): number {
	if (!row) return 0;
	return period === "week" ? row.playedPreviousWeek : row.playedPrevious28Days;
}

export function toDepartmentGameComparisons(
	facilities: Facility[],
	departments: readonly GameDepartment[],
): FacilityGameComparison[] {
	return facilities.map((facility) => {
		const { metrics } = facility.toJSON();
		return {
			facilityId: facility.id,
			playedLastWeek: sumGameDepartments(metrics.gamesLastWeekByDepartment, departments),
			playedPreviousWeek: sumGameDepartments(metrics.gamesPreviousWeekByDepartment, departments),
			playedLast28Days: sumGameDepartments(metrics.gamesByDepartment, departments),
			playedPrevious28Days: sumGameDepartments(metrics.gamesPreviousByDepartment, departments),
		};
	});
}

export function toMarketGameChanges(
	facilities: Facility[],
	comparisons: FacilityGameComparison[],
	period: StatsPeriod,
): MarketGameChangeView[] {
	const byId = new Map(comparisons.map((row) => [row.facilityId, row]));
	const markets = new Map<string, MarketGameChangeView>();
	for (const facility of facilities) {
		const counts = facility.memberIds.map((id) => byId.get(id));
		const current = counts.reduce((sum, row) => sum + currentGames(row, period), 0);
		const previous = counts.reduce((sum, row) => sum + previousGames(row, period), 0);
		const market = markets.get(facility.marketId) ?? {
			id: facility.marketId,
			name: facility.marketName,
			played: 0,
			playedPrevious: 0,
			change: 0,
			changePercent: null,
			facilities: [],
		};
		market.played += current;
		market.playedPrevious += previous;
		market.facilities.push({
			id: facility.id,
			name: facility.toJSON().name,
			played: current,
			playedPrevious: previous,
			change: current - previous,
			changePercent: previous > 0 ? ((current - previous) / previous) * 100 : null,
		});
		markets.set(market.id, market);
	}
	return [...markets.values()].map((market) => ({
		...market,
		change: market.played - market.playedPrevious,
		changePercent:
			market.playedPrevious > 0
				? ((market.played - market.playedPrevious) / market.playedPrevious) * 100
				: null,
	}));
}
