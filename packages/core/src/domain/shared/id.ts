import type { EntityId } from "@core/domain/shared/id.types";

export function asEntityId(value: string): EntityId {
	return value as EntityId;
}
