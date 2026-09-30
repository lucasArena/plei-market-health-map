import type { ACTIVITY_COUNTERS } from "@core/application/dtos/app-metrics-dto";

export type ActivityCounter = (typeof ACTIVITY_COUNTERS)[number];

export type ActivityCounters = Record<ActivityCounter, number>;

export interface ActivityUser {
	userId: string;
	email: string;
	name?: string | null;
}

export interface ActivityReport {
	minutes?: number;
	visits?: number;
	counters?: Partial<ActivityCounters>;
}

export interface RecordDailyActivityInput {
	user: ActivityUser;
	report: ActivityReport;
}

export interface DailyActivity {
	userId: string;
	email: string;
	name: string | null;
	day: string;
	firstSeenAt: Date;
	lastSeenAt: Date;
	minutesActive: number;
	visits: number;
	counters: ActivityCounters;
}

export interface DailyActivityIncrement {
	userId: string;
	email: string;
	name: string | null;
	day: string;
	at: Date;
	minutes: number;
	visits: number;
	counters: ActivityCounters;
}

export interface AppMetricsWeekView {
	weekStart: string;
	activeTargetCount: number;
	targetPercent: number;
	activeUserCount: number;
}

export interface AppMetricsView {
	weekStart: string;
	weekEnd: string;
	goalPercent: number;
	targetCount: number;
	activeTargetCount: number;
	targetPercent: number;
	isGoalMet: boolean;
	activeUserCount: number;
	inactiveTargets: string[];
	weeks: AppMetricsWeekView[];
}

export interface AppMetricsPersonView {
	email: string;
	name: string | null;
	isTarget: boolean;
	daysActive: number;
	visits: number;
	minutes: number;
	topFeature: ActivityCounter | null;
	lastSeenAt: string | null;
}

export interface ListAppMetricsPeopleInput {
	page?: number | string;
	pageSize?: number | string;
}

export interface AppMetricsPeoplePage {
	rows: AppMetricsPersonView[];
	page: number;
	pageSize: number;
	total: number;
	pageCount: number;
}
