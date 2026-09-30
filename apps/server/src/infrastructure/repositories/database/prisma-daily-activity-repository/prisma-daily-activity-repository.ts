import type {
	DailyActivity,
	DailyActivityIncrement,
	DailyActivityRepository,
} from "@market-health-map/core/application";
import type { PrismaClient } from "@server/infrastructure/generated/prisma/client";
import {
	toDailyActivity,
	toDayDate,
} from "@server/infrastructure/repositories/database/daily-activity-record/daily-activity-record";

export class PrismaDailyActivityRepository implements DailyActivityRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async record(increment: DailyActivityIncrement): Promise<void> {
		const { counters } = increment;
		await this.prisma.dailyActivity.upsert({
			where: { userId_day: { userId: increment.userId, day: toDayDate(increment.day) } },
			create: {
				userId: increment.userId,
				day: toDayDate(increment.day),
				email: increment.email,
				name: increment.name,
				firstSeenAt: increment.at,
				lastSeenAt: increment.at,
				minutesActive: increment.minutes,
				visits: increment.visits,
				...counters,
			},
			update: {
				email: increment.email,
				...(increment.name ? { name: increment.name } : {}),
				lastSeenAt: increment.at,
				minutesActive: { increment: increment.minutes },
				visits: { increment: increment.visits },
				facilitiesOpened: { increment: counters.facilitiesOpened },
				marketSummariesOpened: { increment: counters.marketSummariesOpened },
				searches: { increment: counters.searches },
				aiSummaries: { increment: counters.aiSummaries },
				feedbackSent: { increment: counters.feedbackSent },
			},
		});
	}

	async listBetween(fromDay: string, toDay: string): Promise<DailyActivity[]> {
		const rows = await this.prisma.dailyActivity.findMany({
			where: { day: { gte: toDayDate(fromDay), lte: toDayDate(toDay) } },
		});
		return rows.map(toDailyActivity);
	}

	async deleteBefore(day: string): Promise<void> {
		await this.prisma.dailyActivity.deleteMany({ where: { day: { lt: toDayDate(day) } } });
	}
}
