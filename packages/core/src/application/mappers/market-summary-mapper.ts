import type { StatsPeriod } from "@core/application/dtos/facility-detail-dto.types";
import type {
	MarketSummaryFacilityRankView,
	MarketSummaryMarketRankView,
	MarketSummaryPeriodView,
	MarketSummaryScopeView,
} from "@core/application/dtos/market-summary-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import {
	type EntityId,
	type Facility,
	type GameDepartment,
	sumGameDepartments,
} from "@core/domain";

export const MARKET_SUMMARY_RANK_LIMIT = 5;

/** A facility's games in the period, only from the selected departments when there are any. */
function gamesOf(
	facility: Facility,
	period: StatsPeriod,
	departments: readonly GameDepartment[] = [],
): number {
	const { metrics } = facility.toJSON();
	if (departments.length > 0) {
		const counts =
			period === "week" ? metrics.gamesLastWeekByDepartment : metrics.gamesByDepartment;
		return sumGameDepartments(counts, departments);
	}
	return period === "week" ? metrics.gamesLastWeek : metrics.gamesLast28Days;
}

function byGamesThenName<Rank extends { games: number; name: string }>(
	left: Rank,
	right: Rank,
): number {
	return right.games - left.games || left.name.localeCompare(right.name);
}

export function toMarketMemberIds(facilities: Facility[]): EntityId[] {
	return [...new Set(facilities.flatMap((facility) => facility.memberIds))];
}

export function selectMarketFacilities(facilities: Facility[], market?: string): Facility[] {
	if (market === undefined) return facilities;
	const selected = facilities.filter((facility) => facility.marketId === market);
	if (selected.length === 0) throw new NotFoundError("Market");
	return selected;
}

export function toMarketSummaryScope(
	facilities: Facility[],
	period: StatsPeriod,
	departments: readonly GameDepartment[] = [],
): MarketSummaryScopeView {
	const active = facilities.filter((facility) => gamesOf(facility, period, departments) > 0);
	return {
		facilityCount: facilities.length,
		activeFacilityCount: active.length,
		marketCount: new Set(facilities.map((facility) => facility.marketId)).size,
		activeMarketCount: new Set(active.map((facility) => facility.marketId)).size,
	};
}

export function toTopFacilities(
	facilities: Facility[],
	period: StatsPeriod,
	limit: number = MARKET_SUMMARY_RANK_LIMIT,
	departments: readonly GameDepartment[] = [],
): MarketSummaryFacilityRankView[] {
	return facilities
		.map((facility) => ({
			id: facility.id,
			name: facility.toJSON().name,
			marketName: facility.marketName,
			games: gamesOf(facility, period, departments),
		}))
		.filter((rank) => rank.games > 0)
		.sort(byGamesThenName)
		.slice(0, limit);
}

export function toTopMarkets(
	facilities: Facility[],
	period: StatsPeriod,
	limit: number = MARKET_SUMMARY_RANK_LIMIT,
	departments: readonly GameDepartment[] = [],
): MarketSummaryMarketRankView[] {
	const markets = new Map<string, MarketSummaryMarketRankView>();
	for (const facility of facilities) {
		const games = gamesOf(facility, period, departments);
		const current = markets.get(facility.marketId) ?? {
			id: facility.marketId,
			name: facility.marketName,
			facilityCount: 0,
			activeFacilityCount: 0,
			games: 0,
		};
		markets.set(facility.marketId, {
			...current,
			facilityCount: current.facilityCount + 1,
			activeFacilityCount: current.activeFacilityCount + Number(games > 0),
			games: current.games + games,
		});
	}
	return [...markets.values()]
		.filter((rank) => rank.games > 0)
		.sort(byGamesThenName)
		.slice(0, limit);
}

export function toMarketSummaryPeriod(
	facilities: Facility[],
	period: StatsPeriod,
	departments: readonly GameDepartment[] = [],
): MarketSummaryPeriodView {
	return {
		scope: toMarketSummaryScope(facilities, period, departments),
		topFacilities: toTopFacilities(facilities, period, MARKET_SUMMARY_RANK_LIMIT, departments),
		topMarkets: toTopMarkets(facilities, period, MARKET_SUMMARY_RANK_LIMIT, departments),
	};
}
