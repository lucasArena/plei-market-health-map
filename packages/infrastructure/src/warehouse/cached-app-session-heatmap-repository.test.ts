import { CachedAppSessionHeatmapRepository } from "@infra/warehouse/cached-app-session-heatmap-repository";

const CELL = { lat: 29.746, lng: -95.352, sessionWeight: 1134 };

function setup() {
	let now = 0;
	const listLast28Days = vi.fn().mockResolvedValue([CELL]);
	const repository = new CachedAppSessionHeatmapRepository(
		{ listLast28Days },
		{ now: () => new Date(now) },
		1000,
	);
	return { listLast28Days, repository, advance: (ms: number) => (now += ms) };
}

describe("CachedAppSessionHeatmapRepository", () => {
	it("serves repeat calls from the cache until it expires", async () => {
		const { listLast28Days, repository, advance } = setup();

		await repository.listLast28Days();
		advance(999);
		await expect(repository.listLast28Days()).resolves.toEqual([CELL]);
		expect(listLast28Days).toHaveBeenCalledTimes(1);

		advance(1);
		await repository.listLast28Days();
		expect(listLast28Days).toHaveBeenCalledTimes(2);
	});

	it("does not cache failures", async () => {
		const { listLast28Days, repository } = setup();
		listLast28Days.mockRejectedValueOnce(new Error("warehouse down"));

		await expect(repository.listLast28Days()).rejects.toThrow("warehouse down");
		await expect(repository.listLast28Days()).resolves.toEqual([CELL]);
		expect(listLast28Days).toHaveBeenCalledTimes(2);
	});

	it("uses a five-minute cache by default", async () => {
		const listLast28Days = vi.fn().mockResolvedValue([]);
		const repository = new CachedAppSessionHeatmapRepository(
			{ listLast28Days },
			{ now: () => new Date(0) },
		);
		await repository.listLast28Days();
		await repository.listLast28Days();
		expect(listLast28Days).toHaveBeenCalledTimes(1);
	});
});
