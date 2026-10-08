import {
	facilitiesForIds,
	facilitiesForPeriod,
	marketBounds,
	toFacilityFeatureCollection,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.facilities";

const FACILITY = {
	id: "f1",
	marketId: "austin",
	marketName: "Austin",
	name: "Eastside Futsal Arena",
	avatarUrl: null,
	isActive: true,
	isActiveLastWeek: true,
	location: { latitude: 30.27, longitude: -97.74 },
};

describe("toFacilityFeatureCollection", () => {
	it("turns facilities into GeoJSON points", () => {
		expect(toFacilityFeatureCollection([FACILITY])).toEqual({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [-97.74, 30.27] },
					properties: {
						id: "f1",
						marketId: "austin",
						marketName: "Austin",
						name: "Eastside Futsal Arena",
						isActive: true,
						gamesLast28Days: 0,
						gamesPrevious28Days: 0,
					},
				},
			],
		});
	});
});

describe("toFacilityFeatureCollection stacking", () => {
	it("puts inactive facilities first and active last so the active one renders and is picked on top", () => {
		const location = { latitude: 39.96, longitude: -75.15 };
		const facilities = [
			{ ...FACILITY, id: "a1", isActive: true, isActiveLastWeek: true, location },
			{ ...FACILITY, id: "i1", isActive: false, isActiveLastWeek: false, location },
			{ ...FACILITY, id: "a2", isActive: true, isActiveLastWeek: true, location },
			{ ...FACILITY, id: "i2", isActive: false, isActiveLastWeek: false, location },
		];

		const collection = toFacilityFeatureCollection(facilities);

		expect(collection.features.map((feature) => feature.properties.id)).toEqual([
			"i1",
			"i2",
			"a1",
			"a2",
		]);
		expect(facilities.map((facility) => facility.id)).toEqual(["a1", "i1", "a2", "i2"]);
	});
});

describe("facilitiesForIds", () => {
	it("keeps known string ids in order", () => {
		const byId = new Map([["f1", FACILITY]]);
		expect(facilitiesForIds(["f1", "missing", 3, undefined], byId)).toEqual([FACILITY]);
	});
});

describe("marketBounds", () => {
	it("contains every facility or returns null for an empty market", () => {
		expect(
			marketBounds([
				FACILITY,
				{ ...FACILITY, id: "f2", location: { latitude: 31, longitude: -96 } },
			]),
		).toEqual([
			[-97.74, 30.27],
			[-96, 31],
		]);
		expect(marketBounds([])).toBeNull();
	});
});

describe("marketBounds", () => {
	it("returns the corners containing all market facilities", () => {
		expect(
			marketBounds([
				FACILITY,
				{ ...FACILITY, id: "f2", location: { latitude: 31, longitude: -96 } },
			]),
		).toEqual([
			[-97.74, 30.27],
			[-96, 31],
		]);
		expect(marketBounds([])).toBeNull();
	});
});

describe("facilitiesForPeriod", () => {
	it("marks facilities active by last week's games for the week and keeps 28 days otherwise", () => {
		const quietLastWeek = { ...FACILITY, isActive: true, isActiveLastWeek: false };

		expect(facilitiesForPeriod([quietLastWeek], "week")[0]?.isActive).toBe(false);
		expect(facilitiesForPeriod([quietLastWeek], "month")[0]?.isActive).toBe(true);
	});

	it("uses the weekly games windows for the week and the 28 day windows otherwise", () => {
		const counted = {
			...FACILITY,
			gamesLast28Days: 40,
			gamesPrevious28Days: 30,
			gamesByDepartment: { magic: 20, organizers: 10, partnerships: 10 },
			gamesPreviousByDepartment: { magic: 15, organizers: 10, partnerships: 5 },
			gamesLastWeek: 9,
			gamesPreviousWeek: 12,
			gamesLastWeekByDepartment: { magic: 5, organizers: 2, partnerships: 2 },
			gamesPreviousWeekByDepartment: { magic: 6, organizers: 3, partnerships: 3 },
		};

		expect(facilitiesForPeriod([counted], "week")[0]).toMatchObject({
			gamesLast28Days: 9,
			gamesPrevious28Days: 12,
			gamesByDepartment: { magic: 5, organizers: 2, partnerships: 2 },
			gamesPreviousByDepartment: { magic: 6, organizers: 3, partnerships: 3 },
		});
		expect(facilitiesForPeriod([counted], "month")[0]).toMatchObject({
			gamesLast28Days: 40,
			gamesPrevious28Days: 30,
		});
	});
});
