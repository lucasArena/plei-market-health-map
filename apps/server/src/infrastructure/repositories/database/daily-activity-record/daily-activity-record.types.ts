export interface DailyActivityRecord {
	userId: string;
	day: Date;
	email: string;
	name: string | null;
	firstSeenAt: Date;
	lastSeenAt: Date;
	minutesActive: number;
	visits: number;
	facilitiesOpened: number;
	marketSummariesOpened: number;
	searches: number;
	aiSummaries: number;
	feedbackSent: number;
}
