import type { MarketRepository } from "@application/ports/market-repository.types";

export interface ListMarketHealthDeps {
	markets: MarketRepository;
}
