import { SAMPLE_MARKETS } from "@infra/sample/sample-markets";
import type { MarketRepository } from "@market-health-map/application";
import { type EntityId, Market, type MarketProps } from "@market-health-map/domain";

export class SampleMarketRepository implements MarketRepository {
	constructor(private readonly markets: MarketProps[] = SAMPLE_MARKETS) {}

	async listActive(): Promise<Market[]> {
		return this.markets.map((props) => Market.create(props));
	}

	async findById(id: EntityId): Promise<Market | null> {
		const props = this.markets.find((market) => market.id === id);
		return props ? Market.create(props) : null;
	}
}
