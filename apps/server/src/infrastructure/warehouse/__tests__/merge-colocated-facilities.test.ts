import { asEntityId, Facility } from "@market-health-map/core/domain";
import {
	baseFacilityName,
	distanceInMeters,
	mergeColocatedFacilities,
} from "@server/infrastructure/warehouse/merge-colocated-facilities";

const PHIELD = { latitude: 39.96103151952558, longitude: -75.15279661864042 };

function facility(id: string, name: string, gamesLast28Days = 0, location = PHIELD) {
	return Facility.create({
		id: asEntityId(id),
		marketId: asEntityId("22"),
		name,
		address: "814 Spring Garden St, Philadelphia, PA",
		location,
		avatarUrl: null,
		metrics: { activePlayers: 0, gamesLastWeek: 1, gamesLast28Days, utilization: 0 },
	});
}

function summary(facilities: Facility[]) {
	return facilities.map((item) => {
		const { id, name, memberIds, metrics } = item.toJSON();
		return {
			id,
			name,
			memberIds,
			games: metrics.gamesLast28Days,
			gamesLastWeek: metrics.gamesLastWeek,
		};
	});
}

describe("baseFacilityName", () => {
	it("strips everything from the divider onward", () => {
		expect(baseFacilityName("Phield House | Morby")).toBe("Phield House");
		expect(baseFacilityName("North Park Soccer Fields  | gambeta")).toBe(
			"North Park Soccer Fields",
		);
		expect(baseFacilityName("Pitch 25 - Sphere")).toBe("Pitch 25 - Sphere");
		expect(baseFacilityName(" | Orphan suffix ")).toBe("| Orphan suffix");
	});
});

describe("distanceInMeters", () => {
	it("measures great-circle distance", () => {
		expect(distanceInMeters(PHIELD, PHIELD)).toBe(0);
		expect(distanceInMeters(PHIELD, { ...PHIELD, latitude: PHIELD.latitude + 0.001 })).toBeCloseTo(
			111.2,
			0,
		);
	});
});

describe("mergeColocatedFacilities", () => {
	it("merges a suffixed twin into the base facility and sums its metrics", () => {
		const merged = mergeColocatedFacilities([
			facility("698", "Phield House | Morby", 0),
			facility("292", "Phield House", 16),
		]);

		expect(summary(merged)).toEqual([
			{ id: "292", name: "Phield House", memberIds: ["292", "698"], games: 16, gamesLastWeek: 2 },
		]);
	});

	it("uses the base name and lowest id when every member has a suffix", () => {
		const merged = mergeColocatedFacilities([
			facility("846", "SoccerZone | Michelob ULTRA", 2),
			facility("820", "SoccerZone | Morby", 3),
		]);

		expect(summary(merged)).toEqual([
			{ id: "820", name: "SoccerZone", memberIds: ["820", "846"], games: 5, gamesLastWeek: 2 },
		]);
	});

	it("merges exact duplicates without a suffix, ignoring case and spacing", () => {
		const merged = mergeColocatedFacilities([
			facility("40", "Soccer  Town", 1),
			facility("12", "soccer town", 0),
		]);

		expect(summary(merged)).toEqual([
			{ id: "12", name: "soccer town", memberIds: ["12", "40"], games: 1, gamesLastWeek: 2 },
		]);
	});

	it("keeps the same base name at different spots as separate markers", () => {
		const farAway = { latitude: 29.76, longitude: -95.37 };
		const nearby = { ...PHIELD, latitude: PHIELD.latitude + 0.0003 };
		const merged = mergeColocatedFacilities([
			facility("1", "Pitch 25", 1),
			facility("2", "Pitch 25 | Houston", 2, farAway),
			facility("3", "Pitch 25 | Katy", 4, nearby),
		]);

		expect(summary(merged)).toEqual([
			{ id: "1", name: "Pitch 25", memberIds: ["1", "3"], games: 5, gamesLastWeek: 2 },
			{ id: "2", name: "Pitch 25 | Houston", memberIds: ["2"], games: 2, gamesLastWeek: 1 },
		]);
	});

	it("chains members that are each within range of the group", () => {
		const step = 0.0004;
		const merged = mergeColocatedFacilities([
			facility("1", "Fields", 0),
			facility("3", "Fields | C", 0, { ...PHIELD, latitude: PHIELD.latitude + 2 * step }),
			facility("2", "Fields | B", 1, { ...PHIELD, latitude: PHIELD.latitude + step }),
		]);

		expect(summary(merged)).toEqual([
			{ id: "1", name: "Fields", memberIds: ["1", "2", "3"], games: 1, gamesLastWeek: 3 },
		]);
	});

	it("does not merge different facilities at the same spot", () => {
		const merged = mergeColocatedFacilities([
			facility("100", "Sports Creek Houston", 0),
			facility("889", "Pegaso HTX", 241),
		]);

		expect(summary(merged).map((item) => item.id)).toEqual(["100", "889"]);
	});
});
