import type {
	MarketSummaryFacilityRankView,
	MarketSummaryMarketRankView,
	MarketSummaryScopeView,
} from "@core/application/dtos/market-summary-dto.types";
import { NotFoundError } from "@core/application/errors/not-found-error";
import type { EntityId, Facility } from "@core/domain";

export const MARKET_SUMMARY_RANK_LIMIT = 5;

function gamesOf(facility: Facility): number {
	return facility.toJSON().metrics.gamesLast28Days;
}

function byGamesThenName<Rank extends { gamesLast28Days: number; name: string }>(
	left: Rank,
	right: Rank,
): number {
	return right.gamesLast28Days - left.gamesLast28Days || left.name.localeCompare(right.name);
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

export function toMarketSummaryScope(facilities: Facility[]): MarketSummaryScopeView {
	const active = facilities.filter((facility) => gamesOf(facility) > 0);
	return {
		facilityCount: facilities.length,
		activeFacilityCount: active.length,
		marketCount: new Set(facilities.map((facility) => facility.marketId)).size,
		activeMarketCount: new Set(active.map((facility) => facility.marketId)).size,
	};
}

export function toTopFacilities(
	facilities: Facility[],
	limit: number = MARKET_SUMMARY_RANK_LIMIT,
): MarketSummaryFacilityRankView[] {
	return facilities
		.map((facility) => ({
			id: facility.id,
			name: facility.toJSON().name,
			marketName: facility.marketName,
			gamesLast28Days: gamesOf(facility),
		}))
		.filter((rank) => rank.gamesLast28Days > 0)
		.sort(byGamesThenName)
		.slice(0, limit);
}

export function toTopMarkets(
	facilities: Facility[],
	limit: number = MARKET_SUMMARY_RANK_LIMIT,
): MarketSummaryMarketRankView[] {
	const markets = new Map<string, MarketSummaryMarketRankView>();
	for (const facility of facilities) {
		const games = gamesOf(facility);
		const current = markets.get(facility.marketId) ?? {
			id: facility.marketId,
			name: facility.marketName,
			facilityCount: 0,
			activeFacilityCount: 0,
			gamesLast28Days: 0,
		};
		markets.set(facility.marketId, {
			...current,
			facilityCount: current.facilityCount + 1,
			activeFacilityCount: current.activeFacilityCount + Number(games > 0),
			gamesLast28Days: current.gamesLast28Days + games,
		});
	}
	return [...markets.values()]
		.filter((rank) => rank.gamesLast28Days > 0)
		.sort(byGamesThenName)
		.slice(0, limit);
}
