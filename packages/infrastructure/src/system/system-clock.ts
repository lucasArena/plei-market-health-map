import type { Clock } from "@market-health-map/application";

export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}
