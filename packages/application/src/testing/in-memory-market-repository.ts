import type { MarketRepository } from "@application/ports/market-repository.types";
import type { EntityId, Market } from "@market-health-map/domain";

export class InMemoryMarketRepository implements MarketRepository {
	constructor(private readonly markets: Market[] = []) {}

	async listActive(): Promise<Market[]> {
		return [...this.markets];
	}

	async findById(id: EntityId): Promise<Market | null> {
		return this.markets.find((market) => market.id === id) ?? null;
	}
}
