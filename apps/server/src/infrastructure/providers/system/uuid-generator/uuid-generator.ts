import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@market-health-map/core/application";
import { asEntityId, type EntityId } from "@market-health-map/core/domain";

export class UuidGenerator implements IdGenerator {
	generate(): EntityId {
		return asEntityId(randomUUID());
	}
}
