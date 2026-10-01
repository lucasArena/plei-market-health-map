import { CachedAppSessionHeatmapRepository } from "@server/infrastructure/repositories/warehouse/cached-app-session-heatmap-repository/cached-app-session-heatmap-repository";

const CELL = { lat: 29.746, lng: -95.352, sessionWeight: 1134 };

function setup() {
	let now = 0;
	const listLast28Days = vi.fn().mockResolvedValue([CELL]);
	const repository = new CachedAppSessionHeatmapRepository(
		{
			listLast28Days,
			listFilterOptions: vi.fn().mockResolvedValue({ genders: [], skills: [], ages: [] }),
		},
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
			{
				listLast28Days,
				listFilterOptions: vi.fn().mockResolvedValue({ genders: [], skills: [], ages: [] }),
			},
			{ now: () => new Date(0) },
		);
		await repository.listLast28Days();
		await repository.listLast28Days();
		expect(listLast28Days).toHaveBeenCalledTimes(1);
	});
});

it("separates cohorts, canonicalizes key order, and deduplicates concurrent queries", async () => {
	const { repository, listLast28Days } = setup();
	const first = repository.listLast28Days({ gender: "Female", ageMin: 18 });
	expect(repository.listLast28Days({ ageMin: 18, gender: "Female" })).toBe(first);
	await first;
	await repository.listLast28Days({ gender: "Male", ageMin: 18 });
	expect(listLast28Days).toHaveBeenCalledTimes(2);
	expect(listLast28Days).toHaveBeenLastCalledWith({ gender: "Male", ageMin: 18 });
});
it("bounds the cache and removes expired cohorts", async () => {
	const { repository, listLast28Days, advance } = setup();
	for (let ageMin = 0; ageMin < 101; ageMin++) await repository.listLast28Days({ ageMin });
	await repository.listLast28Days({ ageMin: 0 });
	expect(listLast28Days).toHaveBeenCalledTimes(102);
	advance(1000);
	await repository.listLast28Days({ ageMin: 0 });
	expect(listLast28Days).toHaveBeenCalledTimes(103);
});
it("caches filter options and retries failures", async () => {
	let now = 0;
	const listFilterOptions = vi
		.fn()
		.mockRejectedValueOnce(new Error("down"))
		.mockResolvedValue({ genders: ["Female"], skills: [], ages: [] });
	const repository = new CachedAppSessionHeatmapRepository(
		{ listFilterOptions, listLast28Days: vi.fn() },
		{ now: () => new Date(now) },
		1000,
	);
	await expect(repository.listFilterOptions()).rejects.toThrow("down");
	await expect(repository.listFilterOptions()).resolves.toEqual({
		genders: ["Female"],
		skills: [],
		ages: [],
	});
	await repository.listFilterOptions();
	expect(listFilterOptions).toHaveBeenCalledTimes(2);
	now = 1000;
	await repository.listFilterOptions();
	expect(listFilterOptions).toHaveBeenCalledTimes(3);
});
