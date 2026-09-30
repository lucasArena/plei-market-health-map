import { getPrismaClient } from "@server/infrastructure/repositories/database/prisma-client/prisma-client";
import { PrismaDailyActivityRepository } from "@server/infrastructure/repositories/database/prisma-daily-activity-repository/prisma-daily-activity-repository";

const databaseUrl = process.env.DATABASE_URL;
const prisma = databaseUrl ? getPrismaClient(databaseUrl) : null;
const USER_ID = `integration-${Date.now()}`;
const COUNTERS = {
	facilitiesOpened: 1,
	marketSummariesOpened: 0,
	searches: 2,
	aiSummaries: 0,
	feedbackSent: 0,
};

afterAll(async () => {
	await prisma?.dailyActivity.deleteMany({ where: { userId: USER_ID } });
});

describe.skipIf(!prisma)("PrismaDailyActivityRepository", () => {
	it("keeps one row per person per day and adds each report to it", async () => {
		const repository = new PrismaDailyActivityRepository(prisma as NonNullable<typeof prisma>);
		const base = {
			userId: USER_ID,
			email: "integration@plei.com",
			name: "Integration Test",
			day: "2026-09-30",
			counters: COUNTERS,
		};

		await repository.record({
			...base,
			at: new Date("2026-09-30T14:00:00Z"),
			minutes: 0,
			visits: 1,
		});
		await repository.record({
			...base,
			name: null,
			at: new Date("2026-09-30T15:00:00Z"),
			minutes: 12,
			visits: 0,
		});

		const rows = (await repository.listBetween("2026-09-30", "2026-09-30")).filter(
			(row) => row.userId === USER_ID,
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			name: "Integration Test",
			visits: 1,
			minutesActive: 12,
			firstSeenAt: new Date("2026-09-30T14:00:00Z"),
			lastSeenAt: new Date("2026-09-30T15:00:00Z"),
			counters: { facilitiesOpened: 2, searches: 4 },
		});
	});
});
