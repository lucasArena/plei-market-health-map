import { buildSampleFacilities } from "@infra/sample/sample-facilities";
import { SAMPLE_MARKETS } from "@infra/sample/sample-markets";
import type { FacilityRepository } from "@market-health-map/application";
import { Facility, type MarketProps } from "@market-health-map/domain";

export class SampleFacilityRepository implements FacilityRepository {
	constructor(private readonly markets: MarketProps[] = SAMPLE_MARKETS) {}

	async listAll(): Promise<Facility[]> {
		return this.markets.flatMap((market) =>
			buildSampleFacilities(market).map((props) => Facility.create(props)),
		);
	}
}
