import { buildSampleFacilities } from "@infra/sample/sample-facilities";
import { SAMPLE_MARKETS } from "@infra/sample/sample-markets";
import type { FacilityRepository } from "@market-health-map/application";
import { type EntityId, Facility, type MarketProps } from "@market-health-map/domain";

export class SampleFacilityRepository implements FacilityRepository {
	constructor(private readonly markets: MarketProps[] = SAMPLE_MARKETS) {}

	async listByMarket(marketId: EntityId): Promise<Facility[]> {
		const market = this.markets.find((item) => item.id === marketId);
		if (!market) return [];
		return buildSampleFacilities(market).map((props) => Facility.create(props));
	}
}
