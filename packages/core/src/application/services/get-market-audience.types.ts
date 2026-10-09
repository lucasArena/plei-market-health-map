import type { Clock } from "@core/application/providers/clock.types";
import type { FacilityRepository } from "@core/application/repositories/facility-repository.types";
import type { MarketAudienceRepository } from "@core/application/repositories/market-audience-repository.types";

export interface GetMarketAudienceDeps {
	clock: Clock;
	facilities: FacilityRepository;
	audience: MarketAudienceRepository;
}
