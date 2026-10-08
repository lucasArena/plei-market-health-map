import { getMarketPlayerStatsSchema } from "@core/application/dtos/market-summary-dto";
import type {
	GetMarketPlayerStatsInput,
	MarketPlayerStatsView,
} from "@core/application/dtos/market-summary-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { toFacilityPlayerStatsView } from "@core/application/mappers/facility-stats-mapper";
import {
	selectMarketFacilities,
	toMarketMemberIds,
} from "@core/application/mappers/market-summary-mapper";
import type { GetMarketPlayerStatsDeps } from "@core/application/services/get-market-player-stats.types";
import { statsToday } from "@core/application/services/stats-today";

export function makeGetMarketPlayerStats({ facilities, stats, clock }: GetMarketPlayerStatsDeps) {
	return async function getMarketPlayerStats(
		input: GetMarketPlayerStatsInput = {},
	): Promise<MarketPlayerStatsView> {
		const parsed = getMarketPlayerStatsSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const today = statsToday(clock, parsed.data.timeZone);
		const visible = selectMarketFacilities(await facilities.listAll(today), parsed.data.market);
		return toFacilityPlayerStatsView(await stats.getPlayerStats(toMarketMemberIds(visible), today));
	};
}
