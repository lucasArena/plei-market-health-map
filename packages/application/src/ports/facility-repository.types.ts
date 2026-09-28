import type { EntityId, Facility } from "@market-health-map/domain";

export interface FacilityRepository {
	listByMarket(marketId: EntityId): Promise<Facility[]>;
}
