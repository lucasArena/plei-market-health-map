import {
	buildFacilityNames,
	buildSampleFacilities,
	SPREAD_DEGREES,
	scatterAround,
} from "@server/infrastructure/sample/sample-facilities";
import { SampleFacilityRepository } from "@server/infrastructure/sample/sample-facility-repository";
import { SAMPLE_MARKETS } from "@server/infrastructure/sample/sample-markets";
import {
	createSeededRandom,
	distribute,
	hashSeed,
} from "@server/infrastructure/sample/seeded-random";

const AUSTIN = SAMPLE_MARKETS.find((market) => market.id === "austin");

describe("SampleFacilityRepository", () => {
	it("builds one facility per facility counted in each region", async () => {
		const facilities = await new SampleFacilityRepository().listAll();
		const expected = SAMPLE_MARKETS.reduce((sum, market) => sum + market.metrics.facilities, 0);

		expect(facilities).toHaveLength(expected);
		expect(facilities.filter((facility) => facility.marketId === "austin")).toHaveLength(
			AUSTIN?.metrics.facilities ?? -1,
		);
	});

	it("builds nothing without regions", async () => {
		expect(await new SampleFacilityRepository([]).listAll()).toEqual([]);
	});
});

describe("scatterAround", () => {
	it("keeps points within the spread of the center", () => {
		const center = { latitude: 30.27, longitude: -97.74 };
		const random = createSeededRandom("scatter");
		for (let index = 0; index < 50; index += 1) {
			const point = scatterAround(center, random);
			const latOffset = point.latitude - center.latitude;
			const lngOffset =
				(point.longitude - center.longitude) * Math.cos((center.latitude * Math.PI) / 180);
			expect(Math.hypot(latOffset, lngOffset)).toBeLessThanOrEqual(SPREAD_DEGREES + 1e-9);
		}
	});
});

describe("buildSampleFacilities", () => {
	it("is deterministic and adds up to the market totals", () => {
		if (!AUSTIN) throw new Error("Austin sample missing");
		const first = buildSampleFacilities(AUSTIN);

		expect(buildSampleFacilities(AUSTIN)).toEqual(first);
		expect(first.reduce((sum, item) => sum + item.metrics.gamesLastWeek, 0)).toBe(
			AUSTIN.metrics.gamesLastWeek,
		);
		expect(first.reduce((sum, item) => sum + item.metrics.activePlayers, 0)).toBe(
			AUSTIN.metrics.activePlayers,
		);
		expect(first.every((item) => item.address.endsWith("Austin, Texas"))).toBe(true);
		expect(new Set(first.map((item) => item.name)).size).toBe(first.length);
	});
});

describe("buildFacilityNames", () => {
	it("stays unique beyond the base name combinations", () => {
		const names = buildFacilityNames(200, Math.random);
		expect(new Set(names).size).toBe(200);
		expect(names.some((name) => / 2$/.test(name))).toBe(true);
		expect(names.some((name) => / 3$/.test(name))).toBe(true);
	});
});

describe("seeded random helpers", () => {
	it("hashes seeds consistently", () => {
		expect(hashSeed("plei")).toBe(hashSeed("plei"));
		expect(hashSeed("plei")).not.toBe(hashSeed("pleI"));
	});

	it("produces values in [0, 1)", () => {
		const random = createSeededRandom("seed");
		const values = Array.from({ length: 50 }, random);
		expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
	});

	it("distributes totals exactly, even with zero weights", () => {
		expect(distribute(10, [1, 2, 1])).toEqual([3, 5, 2]);
		expect(distribute(10, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(10);
		expect(distribute(0, [0, 0])).toEqual([0, 0]);
		expect(distribute(10, [1, 1, 1])).toEqual([4, 3, 3]);
	});
});
