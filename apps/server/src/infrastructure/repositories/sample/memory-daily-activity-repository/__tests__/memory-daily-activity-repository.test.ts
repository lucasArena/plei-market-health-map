import { MemoryDailyActivityRepository } from "@server/infrastructure/repositories/sample/memory-daily-activity-repository/memory-daily-activity-repository";

describe("MemoryDailyActivityRepository", () => {
	it("keeps activity in memory when no database is configured", async () => {
		const repository = new MemoryDailyActivityRepository();
		const counters = {
			facilitiesOpened: 1,
			marketSummariesOpened: 0,
			searches: 0,
			aiSummaries: 0,
			feedbackSent: 0,
		};

		await repository.record({
			userId: "g-1",
			email: "a@plei.com",
			name: null,
			day: "2026-09-30",
			at: new Date("2026-09-30T15:00:00Z"),
			minutes: 3,
			visits: 1,
			counters,
		});

		expect(await repository.listBetween("2026-09-30", "2026-09-30")).toHaveLength(1);
	});
});
