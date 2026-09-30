import type {
	Clock,
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@market-health-map/core/application";
import { type EntityId, lastCompletedWeekStart } from "@market-health-map/core/domain";
import { createSeededRandom } from "@server/infrastructure/sample/seeded-random";

const DAY_MS = 86_400_000;

function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export class SampleFacilityStatsRepository implements FacilityStatsRepository {
	constructor(private readonly clock: Clock) {}

	async getReservationStats(facilityIds: EntityId[]): Promise<FacilityReservationStats> {
		const {
			uniquePlayersLast28Days: _uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: _uniquePlayersPrevious28Days,
			activatedPlayersLast28Days: _activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: _activatedPlayersPrevious28Days,
			...reservationStats
		} = this.makeCounts(facilityIds);
		return reservationStats;
	}

	async getPlayerStats(facilityIds: EntityId[]): Promise<FacilityPlayerStats> {
		const counts = this.makeCounts(facilityIds);
		return {
			uniquePlayersLast28Days: counts.uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: counts.uniquePlayersPrevious28Days,
			activatedPlayersLast28Days: counts.activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: counts.activatedPlayersPrevious28Days,
		};
	}

	private makeCounts(facilityIds: EntityId[]): FacilityWeeklyCounts {
		const random = createSeededRandom(`${facilityIds.join(",")}-stats`);
		const now = this.clock.now();
		const scheduledLastWeek = Math.round(4 + random() * 40);
		const cancelledLastWeek = Math.round(scheduledLastWeek * random() * 0.4);
		const playedLastWeek = scheduledLastWeek - cancelledLastWeek;
		const playedPreviousWeek = Math.max(0, Math.round(playedLastWeek * (0.8 + random() * 0.4)));
		const earlierWeeks = [
			Math.max(0, Math.round(playedPreviousWeek * (0.75 + random() * 0.35))),
			Math.max(0, Math.round(playedPreviousWeek * (0.8 + random() * 0.3))),
		];
		const weeklyGames = [...earlierWeeks, playedPreviousWeek, playedLastWeek];
		const playedLast28Days = weeklyGames.reduce((total, count) => total + count, 0);
		const scheduledLast28Days = playedLast28Days + Math.round(playedLast28Days * random() * 0.3);
		const playedPrevious28Days = Math.max(0, Math.round(playedLast28Days * (0.7 + random() * 0.5)));
		const scheduledPrevious28Days =
			playedPrevious28Days + Math.round(playedPrevious28Days * random() * 0.3);
		const uniquePlayersLast28Days = Math.round(playedLast28Days * (3 + random() * 2));
		const uniquePlayersPrevious28Days = Math.round(playedPrevious28Days * (3 + random() * 2));
		const activatedPlayersLast28Days = Math.round(playedLast28Days * (0.25 + random() * 0.3));
		const activatedPlayersPrevious28Days = Math.round(
			playedPrevious28Days * (0.25 + random() * 0.3),
		);
		const weekStart = lastCompletedWeekStart(now);
		const start = new Date(`${weekStart}T00:00:00Z`);
		start.setUTCDate(start.getUTCDate() - 21);
		return {
			weekStart,
			playedLastWeek,
			playedPreviousWeek,
			playedLast28Days,
			playedPrevious28Days,
			scheduledLast28Days,
			scheduledPrevious28Days,
			uniquePlayersLast28Days,
			uniquePlayersPrevious28Days,
			activatedPlayersLast28Days,
			activatedPlayersPrevious28Days,
			scheduledLastWeek,
			cancelledLastWeek,
			upcomingNextSevenDays: Math.round(random() * 30),
			lastPlayedDate: isoDate(new Date(now.getTime() - DAY_MS)),
			weeklyActivity: weeklyGames.map((gamesPlayed, index) => ({
				weekStart: isoDate(new Date(start.getTime() + index * 7 * DAY_MS)),
				gamesPlayed,
			})),
			popularTimes: Array.from({ length: 28 }, (_, index) => ({
				dayOfWeek: (index % 7) + 1,
				timePeriod: Math.floor(index / 7),
				gamesPlayed: Math.round(random() * Math.max(2, playedLast28Days / 8)),
			})),
		};
	}
}
