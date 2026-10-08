import { getMarketAudienceSchema } from "@core/application/dtos/market-audience-dto";
import type {
	GetMarketAudienceInput,
	MarketAudienceView,
} from "@core/application/dtos/market-audience-dto.types";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { toMarketAudienceView } from "@core/application/mappers/market-audience-mapper";
import { selectMarketFacilities } from "@core/application/mappers/market-summary-mapper";
import type { GetMarketAudienceDeps } from "@core/application/services/get-market-audience.types";
import { statsToday } from "@core/application/services/stats-today";

export function makeGetMarketAudience({ facilities, audience, clock }: GetMarketAudienceDeps) {
	return async function getMarketAudience(
		input: GetMarketAudienceInput = {},
	): Promise<MarketAudienceView> {
		const parsed = getMarketAudienceSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);
		const { market, timeZone } = parsed.data;
		const today = statsToday(clock, timeZone);
		if (market !== undefined) selectMarketFacilities(await facilities.listAll(today), market);
		return toMarketAudienceView(await audience.getAudience(market ?? null, today));
	};
}
