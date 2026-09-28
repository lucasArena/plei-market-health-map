import type { FacilityRepository } from "@application/ports/facility-repository.types";
import type { MarketRepository } from "@application/ports/market-repository.types";

export interface GetMarketDetailDeps {
	markets: MarketRepository;
	facilities: FacilityRepository;
}
