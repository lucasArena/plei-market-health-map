import { easternDay } from "@market-health-map/core/domain";
import type {
	ActivityReportBody,
	ActivityTrackerOptions,
	TrackedCounter,
} from "@/infrastructure/activity/activity-tracker.types";

export const ACTIVITY_ENDPOINT = "/api/v1/activity";
export const REPORTED_DAY_KEY = "market-health-map:activity:reported-day";
const MINUTE_MS = 60_000;

function emptyCounters(): ActivityReportBody["counters"] {
	return {
		facilitiesOpened: 0,
		marketSummariesOpened: 0,
		searches: 0,
		aiSummaries: 0,
		feedbackSent: 0,
	};
}

function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export class ActivityTracker {
	private readonly endpoint: string;
	private readonly now: () => Date;
	private readonly storage: () => Storage | null;
	private readonly sendBeacon: (url: string, body: string) => boolean;
	private readonly fetch: (url: string, init: RequestInit) => Promise<unknown>;
	private counters = emptyCounters();
	private pendingVisits = 0;
	private visibleMs = 0;
	private visibleSince: number | null = null;
	private isStarted = false;

	constructor({
		endpoint = ACTIVITY_ENDPOINT,
		now = () => new Date(),
		storage = browserStorage,
		sendBeacon = (url, body) =>
			navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" })) ?? false,
		fetch = (url, init) => window.fetch(url, init),
	}: ActivityTrackerOptions = {}) {
		this.endpoint = endpoint;
		this.now = now;
		this.storage = storage;
		this.sendBeacon = sendBeacon;
		this.fetch = fetch;
	}

	start(): void {
		if (this.isStarted) return;
		this.isStarted = true;
		this.resume();
		if (this.hasReportedToday()) {
			this.pendingVisits += 1;
			return;
		}
		this.markReportedToday();
		void this.fetch(this.endpoint, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ visits: 1 }),
			keepalive: true,
			credentials: "include",
		}).catch(() => undefined);
	}

	stop(): void {
		this.flush();
		this.isStarted = false;
		this.visibleSince = null;
	}

	count(counter: TrackedCounter): void {
		this.counters[counter] += 1;
	}

	pause(): void {
		if (this.visibleSince !== null) {
			this.visibleMs += this.now().getTime() - this.visibleSince;
			this.visibleSince = null;
		}
		this.flush();
	}

	resume(): void {
		this.visibleSince ??= this.now().getTime();
	}

	flush(): void {
		const minutes = Math.floor(this.visibleMs / MINUTE_MS);
		const hasCounters = Object.values(this.counters).some((value) => value > 0);
		if (minutes === 0 && this.pendingVisits === 0 && !hasCounters) return;
		const body: ActivityReportBody = {
			minutes,
			visits: this.pendingVisits,
			counters: this.counters,
		};
		if (!this.sendBeacon(this.endpoint, JSON.stringify(body))) return;
		this.visibleMs -= minutes * MINUTE_MS;
		this.pendingVisits = 0;
		this.counters = emptyCounters();
	}

	private hasReportedToday(): boolean {
		try {
			return this.storage()?.getItem(REPORTED_DAY_KEY) === easternDay(this.now());
		} catch {
			return false;
		}
	}

	private markReportedToday(): void {
		try {
			this.storage()?.setItem(REPORTED_DAY_KEY, easternDay(this.now()));
		} catch {
			return;
		}
	}
}

export const activityTracker = new ActivityTracker();
