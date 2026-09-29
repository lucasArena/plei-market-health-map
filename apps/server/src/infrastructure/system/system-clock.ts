import type { Clock } from "@market-health-map/core/application";

export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}
