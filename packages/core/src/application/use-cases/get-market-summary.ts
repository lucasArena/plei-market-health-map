import type { MarketSummaryView } from "@core/application/dtos/market-summary-dto.types";
import { toFacilityReservationStatsView } from "@core/application/mappers/facility-stats-mapper";
import {
	toMarketMemberIds,
	toMarketSummaryScope,
	toTopFacilities,
	toTopMarkets,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketSummaryDeps } from "@core/application/use-cases/get-market-summary.types";

export function makeGetMarketSummary({ facilities, stats }: GetMarketSummaryDeps) {
	return async function getMarketSummary(): Promise<MarketSummaryView> {
		const visible = await facilities.listAll();
		const reservationStats = await stats.getReservationStats(toMarketMemberIds(visible));
		return {
			scope: toMarketSummaryScope(visible),
			stats: toFacilityReservationStatsView(reservationStats),
			topFacilities: toTopFacilities(visible),
			topMarkets: toTopMarkets(visible),
		};
	};
}
