import type {
	Clock,
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@market-health-map/core/application";
import type { EntityId } from "@market-health-map/core/domain";
import { createSeededRandom } from "@server/infrastructure/sample/seeded-random";

const DAY_MS = 86_400_000;

function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function lastWeekStart(now: Date): string {
	const daysSinceMonday = (now.getUTCDay() + 6) % 7;
	const monday = Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate() - daysSinceMonday,
	);
	return isoDate(new Date(monday - 7 * DAY_MS));
}

export class SampleFacilityStatsRepository implements FacilityStatsRepository {
	constructor(private readonly clock: Clock) {}

	async getWeeklyCounts(facilityIds: EntityId[]): Promise<FacilityWeeklyCounts> {
		const random = createSeededRandom(`${facilityIds.join(",")}-stats`);
		const now = this.clock.now();
		const scheduledLastWeek = Math.round(4 + random() * 40);
		const cancelledLastWeek = Math.round(scheduledLastWeek * random() * 0.4);
		const playedLastWeek = scheduledLastWeek - cancelledLastWeek;
		const playedPreviousWeek = Math.max(0, Math.round(playedLastWeek * (0.8 + random() * 0.4)));
		return {
			weekStart: lastWeekStart(now),
			playedLastWeek,
			playedPreviousWeek,
			playedLast28Days:
				playedLastWeek + playedPreviousWeek + Math.round(random() * 2 * playedLastWeek),
			scheduledLastWeek,
			cancelledLastWeek,
			upcomingNextSevenDays: Math.round(random() * 30),
			lastPlayedDate: isoDate(new Date(now.getTime() - DAY_MS)),
		};
	}
}
