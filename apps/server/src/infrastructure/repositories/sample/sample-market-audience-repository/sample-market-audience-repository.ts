import type {
	MarketAudienceCounts,
	MarketAudiencePeriodCounts,
	MarketAudienceRepository,
} from "@market-health-map/core/application";
import { createSeededRandom } from "@server/infrastructure/repositories/sample/seeded-random/seeded-random";

const ALL_MARKETS_WEEKLY_ACTIVE_USERS = 6000;

function jitter(random: () => number, value: number, spread: number): number {
	return Math.round(value * (1 - spread + random() * spread * 2));
}

function period(
	random: () => number,
	activeUsers: number,
	registrations: number,
): MarketAudiencePeriodCounts {
	return {
		activeUsers,
		activeUsersPrevious: jitter(random, activeUsers, 0.15),
		registrations,
		registrationsPrevious: jitter(random, registrations, 0.2),
	};
}

export class SampleMarketAudienceRepository implements MarketAudienceRepository {
	async getAudience(marketId: string | null, today: string): Promise<MarketAudienceCounts> {
		const random = createSeededRandom(`audience|${marketId ?? "all"}|${today}`);
		const weeklyActive =
			marketId === null
				? jitter(random, ALL_MARKETS_WEEKLY_ACTIVE_USERS, 0.1)
				: Math.round(300 + random() * 1200);
		const monthlyActive = Math.round(weeklyActive * (1.8 + random() * 0.4));
		const weeklyRegistrations = Math.round(weeklyActive * (0.05 + random() * 0.04));
		const monthlyRegistrations = jitter(random, weeklyRegistrations * 4, 0.1);
		return {
			week: period(random, weeklyActive, weeklyRegistrations),
			month: period(random, monthlyActive, monthlyRegistrations),
		};
	}
}
