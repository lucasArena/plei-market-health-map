import type {
	Clock,
	FacilityGameComparison,
	FacilityPlayerStats,
	FacilityReservationStats,
	FacilityStatsRepository,
	FacilityWeeklyCounts,
} from "@market-health-map/core/application";
import {
	DEFAULT_STATS_TIME_ZONE,
	type EntityId,
	localDay,
	statsWindow,
} from "@market-health-map/core/domain";
import { createSeededRandom } from "@server/infrastructure/repositories/sample/seeded-random/seeded-random";

function splitIntoWeeks(total: number, weeks = 4): number[] {
	return Array.from(
		{ length: weeks },
		(_, week) => Math.floor(total / weeks) + Number(week < total % weeks),
	);
}

function sumMembers(members: FacilityPlayerStats[], pick: (member: FacilityPlayerStats) => number) {
	return members.reduce((total, member) => total + pick(member), 0);
}

export class SampleFacilityStatsRepository implements FacilityStatsRepository {
	constructor(private readonly clock: Clock) {}

	async getReservationStats(
		facilityIds: EntityId[],
		today: string,
	): Promise<FacilityReservationStats> {
		const {
			uniquePlayersLastWeek: _uniquePlayersLastWeek,
			uniquePlayersPreviousWeek: _uniquePlayersPreviousWeek,
			uniquePlayersLast28Days: _uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: _uniquePlayersPrevious28Days,
			activatedPlayersLastWeek: _activatedPlayersLastWeek,
			activatedPlayersPreviousWeek: _activatedPlayersPreviousWeek,
			activatedPlayersLast28Days: _activatedPlayersLast28Days,
			activatedPlayersPrevious28Days: _activatedPlayersPrevious28Days,
			weeklyActivatedPlayers: _weeklyActivatedPlayers,
			...reservationStats
		} = this.makeCounts(facilityIds, today);
		const members = facilityIds.map((id) => this.makeCounts([id], today));
		return {
			...reservationStats,
			playedLastWeek: members.reduce((total, member) => total + member.playedLastWeek, 0),
			playedPreviousWeek: members.reduce((total, member) => total + member.playedPreviousWeek, 0),
			playedLast28Days: members.reduce((total, member) => total + member.playedLast28Days, 0),
			playedPrevious28Days: members.reduce(
				(total, member) => total + member.playedPrevious28Days,
				0,
			),
			scheduledLast28Days: members.reduce((total, member) => total + member.scheduledLast28Days, 0),
			scheduledPrevious28Days: members.reduce(
				(total, member) => total + member.scheduledPrevious28Days,
				0,
			),
			scheduledLastWeek: members.reduce((total, member) => total + member.scheduledLastWeek, 0),
			scheduledPreviousWeek: members.reduce(
				(total, member) => total + member.scheduledPreviousWeek,
				0,
			),
			cancelledLastWeek: members.reduce((total, member) => total + member.cancelledLastWeek, 0),
			cancelledPreviousWeek: members.reduce(
				(total, member) => total + member.cancelledPreviousWeek,
				0,
			),
			cancelledLast28Days: members.reduce((total, member) => total + member.cancelledLast28Days, 0),
			cancelledPrevious28Days: members.reduce(
				(total, member) => total + member.cancelledPrevious28Days,
				0,
			),
			upcomingNextSevenDays: members.reduce(
				(total, member) => total + member.upcomingNextSevenDays,
				0,
			),
			weeklyActivity: reservationStats.weeklyActivity.map((week, index) => ({
				...week,
				gamesPlayed: members.reduce(
					(total, member) => total + (member.weeklyActivity[index]?.gamesPlayed ?? 0),
					0,
				),
			})),
			popularTimes: reservationStats.popularTimes.map((cell, index) => ({
				...cell,
				gamesPlayed: members.reduce(
					(total, member) => total + (member.popularTimes[index]?.gamesPlayed ?? 0),
					0,
				),
			})),
			lastPlayedDate: members.length > 0 ? reservationStats.lastPlayedDate : null,
		};
	}

	async getGameComparisons(
		facilityIds: EntityId[],
		today: string,
	): Promise<FacilityGameComparison[]> {
		return facilityIds.map((facilityId) => {
			const counts = this.makeCounts([facilityId], today);
			return {
				facilityId,
				playedLastWeek: counts.playedLastWeek,
				playedPreviousWeek: counts.playedPreviousWeek,
				playedLast28Days: counts.playedLast28Days,
				playedPrevious28Days: counts.playedPrevious28Days,
			};
		});
	}

	async getPlayerStats(facilityIds: EntityId[], today: string): Promise<FacilityPlayerStats> {
		const counts = this.makeCounts(facilityIds, today);
		const members = facilityIds.map((id) => this.makeCounts([id], today));
		return {
			uniquePlayersLastWeek: counts.uniquePlayersLastWeek,
			uniquePlayersPreviousWeek: counts.uniquePlayersPreviousWeek,
			uniquePlayersLast28Days: counts.uniquePlayersLast28Days,
			uniquePlayersPrevious28Days: counts.uniquePlayersPrevious28Days,
			activatedPlayersLastWeek: sumMembers(members, (member) => member.activatedPlayersLastWeek),
			activatedPlayersPreviousWeek: sumMembers(
				members,
				(member) => member.activatedPlayersPreviousWeek,
			),
			activatedPlayersLast28Days: sumMembers(
				members,
				(member) => member.activatedPlayersLast28Days,
			),
			activatedPlayersPrevious28Days: sumMembers(
				members,
				(member) => member.activatedPlayersPrevious28Days,
			),
			weeklyActivatedPlayers: counts.weeklyActivatedPlayers.map((week, index) => ({
				...week,
				players: sumMembers(
					members,
					(member) => member.weeklyActivatedPlayers[index]?.players ?? 0,
				),
			})),
		};
	}

	private makeCounts(
		facilityIds: EntityId[],
		today: string = localDay(this.clock.now(), DEFAULT_STATS_TIME_ZONE),
	): FacilityWeeklyCounts {
		const random = createSeededRandom(`${facilityIds.join(",")}-stats`);
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
		const sampledActivatedLast28Days = Math.round(playedLast28Days * (0.25 + random() * 0.3));
		const activatedPlayersPrevious28Days = Math.round(
			playedPrevious28Days * (0.25 + random() * 0.3),
		);
		const scheduledPreviousWeek =
			playedPreviousWeek + Math.round(playedPreviousWeek * random() * 0.3);
		const uniquePlayersLastWeek = Math.round(playedLastWeek * (3 + random() * 2));
		const uniquePlayersPreviousWeek = Math.round(playedPreviousWeek * (3 + random() * 2));
		const activatedPlayersLastWeek = Math.round(playedLastWeek * (0.25 + random() * 0.3));
		const activatedPlayersPreviousWeek = Math.round(playedPreviousWeek * (0.25 + random() * 0.3));
		const activatedPlayersLast28Days = Math.max(
			sampledActivatedLast28Days,
			activatedPlayersLastWeek + activatedPlayersPreviousWeek,
		);
		const earlierActivatedWeeks = splitIntoWeeks(
			activatedPlayersLast28Days - activatedPlayersLastWeek - activatedPlayersPreviousWeek,
			2,
		);
		const week = statsWindow(today, 7);
		const month = statsWindow(today, 28);
		return {
			periodStart: month.start,
			periodEnd: month.end,
			weekStart: week.start,
			playedLastWeek,
			playedPreviousWeek,
			playedLast28Days,
			playedPrevious28Days,
			scheduledLast28Days,
			scheduledPrevious28Days,
			uniquePlayersLastWeek,
			uniquePlayersPreviousWeek,
			uniquePlayersLast28Days,
			uniquePlayersPrevious28Days,
			activatedPlayersLastWeek,
			activatedPlayersPreviousWeek,
			activatedPlayersLast28Days,
			activatedPlayersPrevious28Days,
			scheduledLastWeek,
			scheduledPreviousWeek,
			cancelledLastWeek,
			cancelledPreviousWeek: scheduledPreviousWeek - playedPreviousWeek,
			cancelledLast28Days: scheduledLast28Days - playedLast28Days,
			cancelledPrevious28Days: scheduledPrevious28Days - playedPrevious28Days,
			upcomingNextSevenDays: Math.round(random() * 30),
			lastPlayedDate: month.end,
			weeklyActivity: [...splitIntoWeeks(playedPrevious28Days), ...weeklyGames].map(
				(gamesPlayed, index) => ({
					weekStart: statsWindow(today, 56 - index * 7).start,
					gamesPlayed,
				}),
			),
			weeklyActivatedPlayers: [
				...splitIntoWeeks(activatedPlayersPrevious28Days),
				...earlierActivatedWeeks,
				activatedPlayersPreviousWeek,
				activatedPlayersLastWeek,
			].map((players, index) => ({
				weekStart: statsWindow(today, 56 - index * 7).start,
				players,
			})),
			popularTimes: Array.from({ length: 28 }, (_, index) => ({
				dayOfWeek: (index % 7) + 1,
				timePeriod: Math.floor(index / 7),
				gamesPlayed: Math.round(random() * Math.max(2, playedLast28Days / 8)),
			})),
		};
	}
}
