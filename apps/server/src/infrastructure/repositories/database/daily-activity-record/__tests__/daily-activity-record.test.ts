import {
	toDailyActivity,
	toDayDate,
} from "@server/infrastructure/repositories/database/daily-activity-record/daily-activity-record";

describe("daily activity record", () => {
	it("maps a database row to daily activity with named counters", () => {
		expect(
			toDailyActivity({
				userId: "g-1",
				day: toDayDate("2026-09-30"),
				email: "stefano@plei.com",
				name: null,
				firstSeenAt: new Date("2026-09-30T14:00:00Z"),
				lastSeenAt: new Date("2026-09-30T15:00:00Z"),
				minutesActive: 12,
				visits: 2,
				facilitiesOpened: 3,
				marketSummariesOpened: 1,
				searches: 4,
				aiSummaries: 0,
				feedbackSent: 1,
			}),
		).toMatchObject({
			day: "2026-09-30",
			minutesActive: 12,
			counters: {
				facilitiesOpened: 3,
				marketSummariesOpened: 1,
				searches: 4,
				aiSummaries: 0,
				feedbackSent: 1,
			},
		});
	});
});
