import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@market-health-map/application";
import { asEntityId, type EntityId } from "@market-health-map/domain";

export class UuidGenerator implements IdGenerator {
	generate(): EntityId {
		return asEntityId(randomUUID());
	}
}
