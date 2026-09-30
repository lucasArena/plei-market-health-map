import type { ActivityCounter, ActivityCounters } from "@market-health-map/core/application";

export interface ActivityReportBody {
	minutes: number;
	visits: number;
	counters: ActivityCounters;
}

export interface ActivityTrackerOptions {
	endpoint?: string;
	now?: () => Date;
	storage?: () => Storage | null;
	sendBeacon?: (url: string, body: string) => boolean;
	fetch?: (url: string, init: RequestInit) => Promise<unknown>;
}

export type TrackedCounter = ActivityCounter;
