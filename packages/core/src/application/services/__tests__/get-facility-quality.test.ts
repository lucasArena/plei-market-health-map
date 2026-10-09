import { NotFoundError } from "@core/application/errors/not-found-error";
import type { FacilityQualityWindowCounts } from "@core/application/repositories/facility-quality-repository.types";
import { makeGetFacilityQuality } from "@core/application/services/get-facility-quality";
import { FixedClock } from "@core/application/testing/fakes";
import { InMemoryFacilityQualityRepository } from "@core/application/testing/in-memory-facility-quality-repository";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { asEntityId, Facility } from "@core/domain";

const FACILITY = Facility.create({
	id: asEntityId("292"),
	marketId: asEntityId("22"),
	name: "Phield House",
	address: "814 Spring Garden St, Philadelphia, PA",
	location: { latitude: 39.96, longitude: -75.15 },
	avatarUrl: null,
	memberIds: [asEntityId("698")],
	metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 16, utilization: 0 },
});

function windowCounts(playedGames: number): FacilityQualityWindowCounts {
	return {
		playedGames,
		rosterGames: playedGames,
		rosterPlayers: playedGames * 12,
		waitlistGames: playedGames / 4,
		rosteredCancelledGames: 4,
		almostFilledGames: 1,
		incidentGames: 2,
		ratingCount: 10,
		ratingTotal: 42,
		players: 50,
		returningPlayers: 20,
	};
}

function setup(clock = new FixedClock(new Date("2026-10-08T16:00:00Z"))) {
	const quality = new InMemoryFacilityQualityRepository({
		periods: {
			week: { current: windowCounts(8), previous: windowCounts(4) },
			month: { current: windowCounts(32), previous: windowCounts(40) },
		},
		lowReviews: [{ id: "9", rate: 2, date: "2026-10-03", title: null }],
	});
	const facilities = new InMemoryFacilityRepository([FACILITY]);
	return { quality, getQuality: makeGetFacilityQuality({ clock, facilities, quality }) };
}

describe("makeGetFacilityQuality", () => {
	it("asks for every merged facility member on the viewer's local day", async () => {
		const { getQuality, quality } = setup(new FixedClock(new Date("2026-10-09T02:00:00Z")));

		const view = await getQuality({ facilityId: "698", timeZone: "America/Los_Angeles" });

		expect(quality.requested).toEqual([["292", "698"]]);
		expect(quality.requestedDays).toEqual(["2026-10-08"]);
		expect(view.periods.week).toMatchObject({
			averagePlayersPerGame: 12,
			waitlistGamesRate: 25,
			almostFilledRate: 25,
			averageRating: 4.2,
			ratingCount: 10,
			incidentGamesRate: 25,
			incidentGamesRatePrevious: 50,
			returningPlayersRate: 40,
		});
		expect(view.periods.month.incidentGamesRate).toBe(6.3);
		expect(view.lowReviews).toEqual([{ id: "9", rate: 2, date: "2026-10-03", title: null }]);
	});

	it("rejects an unknown facility", async () => {
		const { getQuality, quality } = setup();

		await expect(getQuality({ facilityId: "404" })).rejects.toBeInstanceOf(NotFoundError);
		expect(quality.requested).toEqual([]);
	});

	it("rejects an empty facility id", async () => {
		const { getQuality } = setup();

		await expect(getQuality({ facilityId: " " })).rejects.toThrow();
	});
});
