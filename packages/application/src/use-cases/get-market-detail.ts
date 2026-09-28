import { getMarketDetailSchema } from "@application/dtos/market-detail-dto";
import type {
	GetMarketDetailInput,
	MarketDetailView,
} from "@application/dtos/market-detail-dto.types";
import { NotFoundError } from "@application/errors/use-case-error";
import { toFacilityView } from "@application/mappers/facility-mapper";
import { toMarketHealthView } from "@application/mappers/market-mapper";
import type { GetMarketDetailDeps } from "@application/use-cases/get-market-detail.types";
import { asEntityId } from "@market-health-map/domain";

export function makeGetMarketDetail({ markets, facilities }: GetMarketDetailDeps) {
	return async function getMarketDetail(input: GetMarketDetailInput): Promise<MarketDetailView> {
		const marketId = asEntityId(getMarketDetailSchema.parse(input).marketId);
		const market = await markets.findById(marketId);
		if (!market) throw new NotFoundError("Market");

		const marketFacilities = await facilities.listByMarket(marketId);
		return {
			market: toMarketHealthView(market),
			facilities: marketFacilities
				.map(toFacilityView)
				.sort((a, b) => b.metrics.gamesLastWeek - a.metrics.gamesLastWeek),
		};
	};
}
