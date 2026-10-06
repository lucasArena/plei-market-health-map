import { FEATURE_FLAG_KEYS } from "@core/application/dtos/feature-flags-dto";
import { makeListFacilities } from "@core/application/services/list-facilities";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { asEntityId, Facility } from "@core/domain";

const allFlagsOn = async () => ({ enabled: [...FEATURE_FLAG_KEYS] });

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
			facilities: new InMemoryFacilityRepository([facility("a"), facility("b", 0)]),
			enabledFeatureFlags: allFlagsOn,
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
			facilities: new InMemoryFacilityRepository([trending]),
			enabledFeatureFlags: allFlagsOn,
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

	it("returns an empty list when there are no facilities", async () => {
		const listFacilities = makeListFacilities({
			facilities: new InMemoryFacilityRepository(),
			enabledFeatureFlags: allFlagsOn,
		});
		await expect(listFacilities()).resolves.toEqual([]);
	});

	describe("feature flags", () => {
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
				utilization: 0,
			},
		});
		const base = {
			id: "e",
			marketId: "austin",
			marketName: "austin",
			name: "Location e",
			avatarUrl: null,
			isActive: true,
			location: { latitude: 30.27, longitude: -97.74 },
		};

		function listWith(enabled: string[]) {
			return makeListFacilities({
				facilities: new InMemoryFacilityRepository([trending]),
				enabledFeatureFlags: async () => ({ enabled }),
			})();
		}

		it("leaves every games field out while the games layer is off", async () => {
			await expect(listWith([])).resolves.toEqual([base]);
			await expect(listWith(["player-demographic-filters"])).resolves.toEqual([base]);
		});

		it("leaves the previous window out while the trend is off", async () => {
			await expect(listWith(["facility-games-layer"])).resolves.toEqual([
				{
					...base,
					gamesLast28Days: 6,
					gamesByDepartment: { magic: 1, organizers: 2, partnerships: 3 },
				},
			]);
		});

		it("never sends the trend without the games layer", async () => {
			await expect(listWith(["facility-games-trend"])).resolves.toEqual([base]);
		});

		it("sends games and the previous window while both are on", async () => {
			await expect(listWith(["facility-games-layer", "facility-games-trend"])).resolves.toEqual([
				{
					...base,
					gamesLast28Days: 6,
					gamesByDepartment: { magic: 1, organizers: 2, partnerships: 3 },
					gamesPrevious28Days: 12,
					gamesPreviousByDepartment: { magic: 2, organizers: 4, partnerships: 6 },
				},
			]);
		});

		it("keeps games without a department split while the trend is off", async () => {
			const plain = makeListFacilities({
				facilities: new InMemoryFacilityRepository([facility("a")]),
				enabledFeatureFlags: async () => ({ enabled: ["facility-games-layer"] }),
			});
			await expect(plain()).resolves.toEqual([
				expect.objectContaining({ id: "a", gamesLast28Days: 40 }),
			]);
			expect((await plain())[0]).not.toHaveProperty("gamesByDepartment");
		});
	});
});
