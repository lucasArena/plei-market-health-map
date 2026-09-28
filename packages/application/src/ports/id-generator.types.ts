import type { EntityId } from "@market-health-map/domain";

export interface IdGenerator {
	generate(): EntityId;
}
