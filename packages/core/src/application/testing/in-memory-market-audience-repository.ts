import type {
	MarketAudienceCounts,
	MarketAudienceRepository,
} from "@core/application/repositories/market-audience-repository.types";

export class InMemoryMarketAudienceRepository implements MarketAudienceRepository {
	readonly requested: { marketId: string | null; today: string }[] = [];

	constructor(private readonly counts: MarketAudienceCounts) {}

	async getAudience(marketId: string | null, today: string): Promise<MarketAudienceCounts> {
		this.requested.push({ marketId, today });
		return this.counts;
	}
}
