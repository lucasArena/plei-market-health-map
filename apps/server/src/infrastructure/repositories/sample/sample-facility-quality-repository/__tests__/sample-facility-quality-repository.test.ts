import { SampleFacilityQualityRepository } from "@server/infrastructure/repositories/sample/sample-facility-quality-repository/sample-facility-quality-repository";

const TODAY = "2026-10-09";

const repository = new SampleFacilityQualityRepository();

const FACILITY_IDS = Array.from({ length: 40 }, (_, index) => [`sample-${index}`] as never);

describe("SampleFacilityQualityRepository", () => {
	it("is deterministic for the same merged facility", async () => {
		const first = await repository.getQuality(["austin-1", "austin-2"] as never, TODAY);
		const second = await repository.getQuality(["austin-2", "austin-1"] as never, TODAY);

		expect(second).toEqual(first);
	});

	it("keeps every count inside its denominator", async () => {
		for (const ids of FACILITY_IDS) {
			const quality = await repository.getQuality(ids, TODAY);
			for (const period of [quality.periods.week, quality.periods.month]) {
				for (const counts of [period.current, period.previous]) {
					expect(counts.waitlistGames).toBeLessThanOrEqual(counts.playedGames);
					expect(counts.incidentGames).toBeLessThanOrEqual(counts.playedGames);
					expect(counts.almostFilledGames).toBeLessThanOrEqual(counts.rosteredCancelledGames);
					expect(counts.returningPlayers).toBeLessThanOrEqual(counts.players);
					expect(counts.ratingTotal).toBeLessThanOrEqual(counts.ratingCount * 5);
				}
			}
		}
	});

	it("lists at most five low reviews from the last 28 days, newest first", async () => {
		const reviews = (
			await Promise.all(FACILITY_IDS.map((ids) => repository.getQuality(ids, TODAY)))
		).map((quality) => quality.lowReviews);

		expect(reviews.some((list) => list.length > 0)).toBe(true);
		expect(reviews.some((list) => list.some((review) => review.title === null))).toBe(true);
		for (const list of reviews) {
			expect(list.length).toBeLessThanOrEqual(5);
			const dates = list.map((review) => review.date);
			expect(dates).toEqual([...dates].sort().reverse());
			for (const review of list) {
				expect(review.rate).toBeLessThan(3);
				expect(review.date >= "2026-09-11" && review.date < TODAY).toBe(true);
			}
		}
	});
});
