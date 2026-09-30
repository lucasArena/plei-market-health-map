import type { MarketPlayerStatsView } from "@core/application/dtos/market-summary-dto.types";
import { toFacilityPlayerStatsView } from "@core/application/mappers/facility-stats-mapper";
import { toMarketMemberIds } from "@core/application/mappers/market-summary-mapper";
import type { GetMarketPlayerStatsDeps } from "@core/application/use-cases/get-market-player-stats.types";

export function makeGetMarketPlayerStats({ facilities, stats }: GetMarketPlayerStatsDeps) {
	return async function getMarketPlayerStats(): Promise<MarketPlayerStatsView> {
		const visible = await facilities.listAll();
		return toFacilityPlayerStatsView(await stats.getPlayerStats(toMarketMemberIds(visible)));
	};
}
