import type { Clock } from "@core/application/ports/clock.types";
import type {
	FeedbackTitleGenerator,
	FeedbackTitleRequest,
} from "@core/application/ports/feedback-title-generator.types";
import type { IdGenerator } from "@core/application/ports/id-generator.types";
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

export class StubFeedbackTitleGenerator implements FeedbackTitleGenerator {
	readonly requests: FeedbackTitleRequest[] = [];

	constructor(private readonly result: string | null | Error) {}

	generateTitle(request: FeedbackTitleRequest): Promise<string | null> {
		this.requests.push(request);
		if (this.result instanceof Error) return Promise.reject(this.result);
		return Promise.resolve(this.result);
	}
}
