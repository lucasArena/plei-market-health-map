import { z } from "zod";

export const ACTIVITY_COUNTERS = [
	"facilitiesOpened",
	"marketSummariesOpened",
	"searches",
	"aiSummaries",
	"feedbackSent",
] as const;

export const APP_METRICS_GOAL_PERCENT = 75;
export const APP_METRICS_WEEKS = 8;
export const DAILY_ACTIVITY_RETENTION_DAYS = 180;
export const DEFAULT_PEOPLE_PAGE_SIZE = 10;

const counter = z.number().int().min(0).max(1000).default(0);

export const recordActivitySchema = z.object({
	minutes: z
		.number()
		.int()
		.min(0)
		.max(24 * 60)
		.default(0),
	visits: z.number().int().min(0).max(100).default(0),
	counters: z
		.object({
			facilitiesOpened: counter,
			marketSummariesOpened: counter,
			searches: counter,
			aiSummaries: counter,
			feedbackSent: counter,
		})
		.default({
			facilitiesOpened: 0,
			marketSummariesOpened: 0,
			searches: 0,
			aiSummaries: 0,
			feedbackSent: 0,
		}),
});

export const activityUserSchema = z.object({
	userId: z.string().trim().min(1),
	email: z.email(),
	name: z.string().trim().min(1).nullable().default(null),
});

export const listAppMetricsPeopleSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(50).default(DEFAULT_PEOPLE_PAGE_SIZE),
});
