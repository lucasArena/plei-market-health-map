import type { EntityId } from "@core/domain";

export interface IdGenerator {
	generate(): EntityId;
}
