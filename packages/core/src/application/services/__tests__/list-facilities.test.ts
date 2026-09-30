import { makeListFacilities } from "@core/application/services/list-facilities";
import { InMemoryFacilityRepository } from "@core/application/testing/in-memory-facility-repository";
import { asEntityId, Facility } from "@core/domain";

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
		});

		expect(await listFacilities()).toEqual([
			{
				id: "a",
				marketId: "austin",
				marketName: "austin",
				name: "Location a",
				avatarUrl: null,
				isActive: true,
				location: { latitude: 30.27, longitude: -97.74 },
			},
			{
				id: "b",
				marketId: "austin",
				marketName: "austin",
				name: "Location b",
				avatarUrl: null,
				isActive: false,
				location: { latitude: 30.27, longitude: -97.74 },
			},
		]);
	});

	it("returns an empty list when there are no facilities", async () => {
		const listFacilities = makeListFacilities({ facilities: new InMemoryFacilityRepository() });
		await expect(listFacilities()).resolves.toEqual([]);
	});
});
