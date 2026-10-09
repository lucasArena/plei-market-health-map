import type {
	FacilityLowReview,
	FacilityQuality,
	FacilityQualityRepository,
	FacilityQualityWindowCounts,
} from "@market-health-map/core/application";
import { addDays, type EntityId } from "@market-health-map/core/domain";
import { createSeededRandom } from "@server/infrastructure/repositories/sample/seeded-random/seeded-random";

export const SAMPLE_LOW_REVIEW_TITLES = [
	"Issues with other players",
	"Issues with field conditions",
	"Wasn't Competitive",
	null,
] as const;

function between(random: () => number, min: number, max: number): number {
	return min + random() * (max - min);
}

function sampleWindow(random: () => number, days: number): FacilityQualityWindowCounts {
	const playedGames = Math.round(between(random, 1.5, 9) * days);
	const rosterGames = playedGames;
	const rosteredCancelledGames = Math.round(playedGames * between(random, 0.1, 0.5));
	const ratingCount = Math.round(playedGames * between(random, 0.6, 1.6));
	const players = Math.round(playedGames * between(random, 4, 8));
	return {
		playedGames,
		rosterGames,
		rosterPlayers: Math.round(rosterGames * between(random, 9, 13)),
		waitlistGames: Math.round(playedGames * between(random, 0.2, 0.65)),
		rosteredCancelledGames,
		almostFilledGames: Math.round(rosteredCancelledGames * between(random, 0, 0.15)),
		incidentGames: Math.round(playedGames * between(random, 0.03, 0.15)),
		ratingCount,
		ratingTotal: Math.round(ratingCount * between(random, 4.1, 4.8)),
		players,
		returningPlayers: Math.round(players * between(random, 0.3, 0.6)),
	};
}

function sampleLowReviews(random: () => number, today: string): FacilityLowReview[] {
	const count = Math.floor(random() * 6);
	const ages = Array.from({ length: count }, () => 1 + Math.floor(random() * 28)).sort(
		(a, b) => a - b,
	);
	return ages.map((age, index) => ({
		id: String(900000 - age * 10 - index),
		rate: 1 + Math.floor(random() * 2),
		date: addDays(today, -age),
		title: SAMPLE_LOW_REVIEW_TITLES[index % SAMPLE_LOW_REVIEW_TITLES.length] ?? null,
	}));
}

export class SampleFacilityQualityRepository implements FacilityQualityRepository {
	async getQuality(facilityIds: EntityId[], today: string): Promise<FacilityQuality> {
		const random = createSeededRandom(`${[...facilityIds].sort().join(",")}-quality`);
		return {
			periods: {
				week: { current: sampleWindow(random, 7), previous: sampleWindow(random, 7) },
				month: { current: sampleWindow(random, 28), previous: sampleWindow(random, 28) },
			},
			lowReviews: sampleLowReviews(random, today),
		};
	}
}
