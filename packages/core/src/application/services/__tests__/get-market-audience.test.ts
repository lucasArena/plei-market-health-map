import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { NotFoundError } from "@core/application/errors/not-found-error";
import type { MarketAudienceCounts } from "@core/application/repositories/market-audience-repository.types";
import { makeGetMarketAudience } from "@core/application/services/get-market-audience";
import { FixedClock } from "@core/application/testing/fakes";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { InMemoryMarketAudienceRepository } from "@core/application/testing/in-memory-market-audience-repository";
import { asEntityId, Facility } from "@core/domain";

const TEST_CLOCK = new FixedClock(new Date("2026-10-08T16:00:00Z"));

function facility(id: string, marketId: string) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId(marketId),
		marketName: `Market ${marketId}`,
		name: `Facility ${id}`,
		address: "1 Main St",
		location: { latitude: 39.96, longitude: -75.15 },
		avatarUrl: null,
		memberIds: [],
		metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 3, utilization: 0 },
	});
}

const COUNTS: MarketAudienceCounts = {
	week: {
		activeUsers: 110,
		activeUsersPrevious: 100,
		registrations: 9,
		registrationsPrevious: 0,
	},
	month: {
		activeUsers: 300,
		activeUsersPrevious: 400,
		registrations: 30,
		registrationsPrevious: 40,
	},
};

function setup() {
	const facilities = new InMemoryFacilityRepository([facility("1", "2"), facility("3", "4")]);
	const audience = new InMemoryMarketAudienceRepository(COUNTS);
	return {
		audience,
		facilities,
		getMarketAudience: makeGetMarketAudience({ clock: TEST_CLOCK, facilities, audience }),
	};
}

describe("market audience", () => {
	it("reads all markets with change percents", async () => {
		const { audience, facilities, getMarketAudience } = setup();

		const view = await getMarketAudience();

		expect(audience.requested).toEqual([{ marketId: null, today: "2026-10-08" }]);
		expect(facilities.requestedDays).toEqual([]);
		expect(view.periods.week).toEqual({
			activeUsers: 110,
			activeUsersPrevious: 100,
			activeUsersChangePercent: 10,
			registrations: 9,
			registrationsPrevious: 0,
			registrationsChangePercent: null,
		});
		expect(view.periods.month).toMatchObject({
			activeUsersChangePercent: -25,
			registrationsChangePercent: -25,
		});
	});

	it("checks that a selected market exists before reading its audience", async () => {
		const { audience, facilities, getMarketAudience } = setup();

		await getMarketAudience({ market: "4" });
		await expect(getMarketAudience({ market: "nowhere" })).rejects.toBeInstanceOf(NotFoundError);

		expect(facilities.requestedDays).toEqual(["2026-10-08", "2026-10-08"]);
		expect(audience.requested).toEqual([{ marketId: "4", today: "2026-10-08" }]);
	});

	it("rejects an invalid market", async () => {
		const { audience, getMarketAudience } = setup();

		await expect(getMarketAudience({ market: "" })).rejects.toBeInstanceOf(InvalidRequestError);
		expect(audience.requested).toEqual([]);
	});

	it("resolves today in the viewer's time zone", async () => {
		const facilities = new InMemoryFacilityRepository([facility("1", "2")]);
		const audience = new InMemoryMarketAudienceRepository(COUNTS);
		const clock = new FixedClock(new Date("2026-10-09T05:00:00Z"));
		const getMarketAudience = makeGetMarketAudience({ clock, facilities, audience });

		await getMarketAudience({ timeZone: "America/Los_Angeles" });
		await getMarketAudience({ timeZone: "America/New_York" });

		expect(audience.requested.map((request) => request.today)).toEqual([
			"2026-10-08",
			"2026-10-09",
		]);
	});
});
