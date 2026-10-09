import { makeListFacilities } from "@core/application/services/list-facilities";
import { FixedClock } from "@core/application/testing/fakes";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { asEntityId, Facility } from "@core/domain";

const TEST_CLOCK = new FixedClock(new Date("2026-10-08T16:00:00Z"));

function facility(id: string, gamesLast28Days = 40) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId("austin"),
		name: `Location ${id}`,
		address: "1 Main St",
		location: { latitude: 30.27, longitude: -97.74 },
		avatarUrl: null,
		metrics: { activePlayers: 50, gamesLastWeek: 10, gamesLast28Days, utilization: 60 },
	});
}

describe("listFacilities", () => {
	it("returns every facility as a map point", async () => {
		const listFacilities = makeListFacilities({
			clock: TEST_CLOCK,
			facilities: new InMemoryFacilityRepository([facility("a"), facility("b", 0)]),
		});

		expect(await listFacilities()).toEqual([
			{
				id: "a",
				marketId: "austin",
				marketName: "austin",
				name: "Location a",
				avatarUrl: null,
				isActive: true,
				gamesLast28Days: 40,
				gamesLastWeek: 10,
				isActiveLastWeek: true,
				location: { latitude: 30.27, longitude: -97.74 },
			},
			{
				id: "b",
				marketId: "austin",
				marketName: "austin",
				name: "Location b",
				avatarUrl: null,
				isActive: false,
				gamesLast28Days: 0,
				gamesLastWeek: 10,
				isActiveLastWeek: true,
				location: { latitude: 30.27, longitude: -97.74 },
			},
		]);
	});

	it("passes previous window games through for the trend", async () => {
		const trending = Facility.create({
			id: asEntityId("c"),
			marketId: asEntityId("austin"),
			name: "Location c",
			address: "1 Main St",
			location: { latitude: 30.27, longitude: -97.74 },
			avatarUrl: null,
			metrics: {
				activePlayers: 0,
				gamesLastWeek: 0,
				gamesLast28Days: 0,
				gamesPrevious28Days: 12,
				gamesByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
				gamesPreviousByDepartment: { magic: 2, organizers: 4, partnerships: 6 },
				utilization: 0,
			},
		});
		const listFacilities = makeListFacilities({
			clock: TEST_CLOCK,
			facilities: new InMemoryFacilityRepository([trending]),
		});

		expect((await listFacilities())[0]).toMatchObject({
			isActive: false,
			gamesLast28Days: 0,
			gamesPrevious28Days: 12,
			gamesPreviousByDepartment: { magic: 2, organizers: 4, partnerships: 6 },
		});
	});

	it("rejects negative previous window games", () => {
		expect(() =>
			Facility.create({
				id: asEntityId("d"),
				marketId: asEntityId("austin"),
				name: "Location d",
				address: "1 Main St",
				location: { latitude: 30.27, longitude: -97.74 },
				avatarUrl: null,
				metrics: {
					activePlayers: 0,
					gamesLastWeek: 0,
					gamesLast28Days: 0,
					gamesPrevious28Days: -1,
					utilization: 0,
				},
			}),
		).toThrow("non-negative");
	});

	it("rejects negative previous week games", () => {
		expect(() =>
			Facility.create({
				id: asEntityId("d"),
				marketId: asEntityId("austin"),
				name: "Location d",
				address: "1 Main St",
				location: { latitude: 30.27, longitude: -97.74 },
				avatarUrl: null,
				metrics: {
					activePlayers: 0,
					gamesLastWeek: 0,
					gamesLast28Days: 0,
					gamesPreviousWeek: -1,
					utilization: 0,
				},
			}),
		).toThrow("non-negative");
	});

	it("returns an empty list when there are no facilities", async () => {
		const listFacilities = makeListFacilities({
			clock: TEST_CLOCK,
			facilities: new InMemoryFacilityRepository(),
		});
		await expect(listFacilities()).resolves.toEqual([]);
	});

	describe("games fields", () => {
		const trending = Facility.create({
			id: asEntityId("e"),
			marketId: asEntityId("austin"),
			name: "Location e",
			address: "1 Main St",
			location: { latitude: 30.27, longitude: -97.74 },
			avatarUrl: null,
			metrics: {
				activePlayers: 0,
				gamesLastWeek: 0,
				gamesLast28Days: 6,
				gamesPrevious28Days: 12,
				gamesByDepartment: { magic: 1, organizers: 2, partnerships: 3 },
				gamesPreviousByDepartment: { magic: 2, organizers: 4, partnerships: 6 },
				gamesLastWeekByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
				gamesPreviousWeek: 3,
				gamesPreviousWeekByDepartment: { magic: 1, organizers: 1, partnerships: 1 },
				utilization: 0,
			},
		});

		it("always sends games, department totals and the previous windows", async () => {
			const listFacilities = makeListFacilities({
				clock: TEST_CLOCK,
				facilities: new InMemoryFacilityRepository([trending]),
			});

			await expect(listFacilities()).resolves.toEqual([
				{
					id: "e",
					marketId: "austin",
					marketName: "austin",
					name: "Location e",
					avatarUrl: null,
					isActive: true,
					isActiveLastWeek: false,
					location: { latitude: 30.27, longitude: -97.74 },
					gamesLast28Days: 6,
					gamesByDepartment: { magic: 1, organizers: 2, partnerships: 3 },
					gamesPrevious28Days: 12,
					gamesPreviousByDepartment: { magic: 2, organizers: 4, partnerships: 6 },
					gamesLastWeek: 0,
					gamesLastWeekByDepartment: { magic: 0, organizers: 0, partnerships: 0 },
					gamesPreviousWeek: 3,
					gamesPreviousWeekByDepartment: { magic: 1, organizers: 1, partnerships: 1 },
				},
			]);
		});

		it("keeps games without a department split when the facility has none", async () => {
			const plain = makeListFacilities({
				clock: TEST_CLOCK,
				facilities: new InMemoryFacilityRepository([facility("a")]),
			});

			await expect(plain()).resolves.toEqual([
				expect.objectContaining({ id: "a", gamesLast28Days: 40 }),
			]);
			expect((await plain())[0]).not.toHaveProperty("gamesByDepartment");
		});
	});
});
