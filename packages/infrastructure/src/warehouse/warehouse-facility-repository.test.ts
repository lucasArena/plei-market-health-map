import {
	ACTIVE_LOCATIONS_SQL,
	toFacility,
	WarehouseFacilityRepository,
} from "@infra/warehouse/warehouse-facility-repository";

function row(overrides: object = {}) {
	return {
		location_id: 1042,
		location_name: "The Sports Yard | Section 109",
		address: "123 Main St",
		city: "St. Louis",
		state: "Missouri",
		region_id: 7,
		region_name: "St. Louis",
		location_latitude: 38.62,
		location_longitude: -90.19,
		played_last_28_days: "12",
		...overrides,
	};
}

describe("toFacility", () => {
	it("maps a warehouse row to a facility", () => {
		expect(toFacility(row())?.toJSON()).toEqual({
			id: "1042",
			marketId: "7",
			name: "The Sports Yard | Section 109",
			address: "123 Main St, St. Louis, Missouri",
			location: { latitude: 38.62, longitude: -90.19 },
			avatarUrl: null,
			metrics: { activePlayers: 0, gamesLastWeek: 0, gamesLast28Days: 12, utilization: 0 },
		});
	});

	it("falls back for missing region and address parts", () => {
		const facility = toFacility(row({ region_id: null, address: null, city: " ", state: null }));
		expect(facility?.toJSON()).toMatchObject({ marketId: "unassigned", address: "St. Louis" });
		expect(
			toFacility(row({ address: null, city: null, state: null, region_name: null }))?.toJSON()
				.address,
		).toBe("—");
	});

	it("skips unnamed, test and invalid locations", () => {
		expect(toFacility(row({ location_name: " " }))).toBeNull();
		expect(toFacility(row({ location_name: null }))).toBeNull();
		expect(toFacility(row({ location_name: "QA Test Soft Delete" }))).toBeNull();
		expect(toFacility(row({ region_name: "L2M Region" }))).toBeNull();
		expect(toFacility(row({ location_latitude: -84.23, location_longitude: 156.34 }))).toBeNull();
		expect(toFacility(row({ address: null, city: null, state: null, region_name: "" }))).toBeNull();
	});
});

describe("WarehouseFacilityRepository", () => {
	it("queries active located facilities and keeps the valid ones", async () => {
		const query = vi.fn().mockResolvedValue({
			rows: [row(), row({ location_id: 2, location_name: "adidas TEST" })],
		});

		const facilities = await new WarehouseFacilityRepository({ query }).listAll();

		expect(query).toHaveBeenCalledWith(ACTIVE_LOCATIONS_SQL);
		expect(ACTIVE_LOCATIONS_SQL).toContain("deleted_at is null");
		expect(ACTIVE_LOCATIONS_SQL).toContain("r.date_with_time::date >= b.this_week - 28");
		expect(ACTIVE_LOCATIONS_SQL).toContain("r.date_with_time::date < b.this_week");
		expect(facilities.map((facility) => facility.id)).toEqual(["1042"]);
	});
});
