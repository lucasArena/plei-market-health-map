import { asEntityId, Facility } from "@market-health-map/core/domain";
import { CachedFacilityRepository } from "@server/infrastructure/warehouse/cached-facility-repository";

const FACILITY = Facility.create({
	id: asEntityId("1"),
	marketId: asEntityId("7"),
	name: "The Sports Yard",
	address: "123 Main St",
	location: { latitude: 38.6, longitude: -90.2 },
	avatarUrl: null,
	metrics: { activePlayers: 0, gamesLastWeek: 0, utilization: 0 },
});

function setup() {
	let now = 0;
	const listAll = vi.fn().mockResolvedValue([FACILITY]);
	const repository = new CachedFacilityRepository({ listAll }, { now: () => new Date(now) }, 1000);
	return { listAll, repository, advance: (ms: number) => (now += ms) };
}

describe("CachedFacilityRepository", () => {
	it("serves repeat calls from the cache until it expires", async () => {
		const { listAll, repository, advance } = setup();

		await repository.listAll();
		advance(999);
		await expect(repository.listAll()).resolves.toEqual([FACILITY]);
		expect(listAll).toHaveBeenCalledTimes(1);

		advance(1);
		await repository.listAll();
		expect(listAll).toHaveBeenCalledTimes(2);
	});

	it("does not cache failures", async () => {
		const { listAll, repository } = setup();
		listAll.mockRejectedValueOnce(new Error("warehouse down"));

		await expect(repository.listAll()).rejects.toThrow("warehouse down");
		await expect(repository.listAll()).resolves.toEqual([FACILITY]);
		expect(listAll).toHaveBeenCalledTimes(2);
	});

	it("uses a five-minute cache by default", async () => {
		const listAll = vi.fn().mockResolvedValue([]);
		const repository = new CachedFacilityRepository({ listAll }, { now: () => new Date(0) });
		await repository.listAll();
		await repository.listAll();
		expect(listAll).toHaveBeenCalledTimes(1);
	});
});
