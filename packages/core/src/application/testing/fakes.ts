import type { Clock } from "@core/application/providers/clock.types";
import type { IdGenerator } from "@core/application/providers/id-generator.types";
import type { EntityId } from "@core/domain";

export class FixedClock implements Clock {
	constructor(private readonly value: Date) {}

	now(): Date {
		return this.value;
	}
}

export class SequentialIdGenerator implements IdGenerator {
	private index = 0;

	constructor(private readonly ids: EntityId[]) {}

	generate(): EntityId {
		const id = this.ids[this.index];
		if (!id) throw new Error("SequentialIdGenerator ran out of identifiers.");
		this.index += 1;
		return id;
	}
}
