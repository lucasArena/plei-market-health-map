import type { EntityId, Market } from "@market-health-map/domain";

export interface MarketRepository {
	listActive(): Promise<Market[]>;
	findById(id: EntityId): Promise<Market | null>;
}
