import type { FacilityRepository } from "@market-health-map/core/application";
import { Facility, type MarketProps } from "@market-health-map/core/domain";
import { buildSampleFacilities } from "@server/infrastructure/repositories/sample/sample-facilities/sample-facilities";
import { SAMPLE_MARKETS } from "@server/infrastructure/repositories/sample/sample-markets/sample-markets";

export class SampleFacilityRepository implements FacilityRepository {
	constructor(private readonly markets: MarketProps[] = SAMPLE_MARKETS) {}

	async listAll(): Promise<Facility[]> {
		return this.markets.flatMap((market) =>
			buildSampleFacilities(market).map((props) => Facility.create(props)),
		);
	}
}
