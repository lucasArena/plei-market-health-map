import type { MarketGameChangeView } from "@core/application/dtos/market-summary-dto.types";
import type { FacilityGameComparison } from "@core/application/ports/facility-stats-repository.types";
import type { Facility } from "@core/domain";

export function toMarketGameChanges(
	facilities: Facility[],
	comparisons: FacilityGameComparison[],
): MarketGameChangeView[] {
	const byId = new Map(comparisons.map((row) => [row.facilityId, row]));
	const markets = new Map<string, MarketGameChangeView>();
	for (const facility of facilities) {
		const counts = facility.memberIds.map((id) => byId.get(id));
		const current = counts.reduce((sum, row) => sum + (row?.playedLast28Days ?? 0), 0);
		const previous = counts.reduce((sum, row) => sum + (row?.playedPrevious28Days ?? 0), 0);
		const market = markets.get(facility.marketId) ?? {
			id: facility.marketId,
			name: facility.marketName,
			playedLast28Days: 0,
			playedPrevious28Days: 0,
			change: 0,
			changePercent: null,
			facilities: [],
		};
		market.playedLast28Days += current;
		market.playedPrevious28Days += previous;
		market.facilities.push({
			id: facility.id,
			name: facility.toJSON().name,
			playedLast28Days: current,
			playedPrevious28Days: previous,
			change: current - previous,
			changePercent: previous > 0 ? ((current - previous) / previous) * 100 : null,
		});
		markets.set(market.id, market);
	}
	return [...markets.values()].map((market) => ({
		...market,
		change: market.playedLast28Days - market.playedPrevious28Days,
		changePercent:
			market.playedPrevious28Days > 0
				? ((market.playedLast28Days - market.playedPrevious28Days) / market.playedPrevious28Days) *
					100
				: null,
	}));
}
