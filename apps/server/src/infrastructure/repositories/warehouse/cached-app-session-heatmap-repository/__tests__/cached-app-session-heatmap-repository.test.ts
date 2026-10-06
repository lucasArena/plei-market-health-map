import {
	APP_SESSION_HEATMAP_CACHE_TTL_MS,
	CachedAppSessionHeatmapRepository,
} from "@server/infrastructure/repositories/warehouse/cached-app-session-heatmap-repository/cached-app-session-heatmap-repository";

const CELL = { lat: 29.746, lng: -95.352, sessionWeight: 1134 };

function setup() {
	let now = 0;
	const listSessions = vi.fn().mockResolvedValue([CELL]);
	const repository = new CachedAppSessionHeatmapRepository(
		{
			listSessions,
			listFilterOptions: vi.fn().mockResolvedValue({ genders: [], skills: [], ages: [] }),
		},
		{ now: () => new Date(now) },
		1000,
	);
	return { listSessions, repository, advance: (ms: number) => (now += ms) };
}

describe("CachedAppSessionHeatmapRepository", () => {
	it("serves repeat calls from the cache until it expires", async () => {
		const { listSessions, repository, advance } = setup();

		await repository.listSessions("month");
		advance(999);
		await expect(repository.listSessions("month")).resolves.toEqual([CELL]);
		expect(listSessions).toHaveBeenCalledTimes(1);

		advance(1);
		await repository.listSessions("month");
		expect(listSessions).toHaveBeenCalledTimes(2);
	});

	it("caches each period separately", async () => {
		const { listSessions, repository } = setup();

		await repository.listSessions("month");
		await repository.listSessions("week");
		await repository.listSessions("week");

		expect(listSessions.mock.calls.map(([period]) => period)).toEqual(["month", "week"]);
	});

	it("does not cache failures", async () => {
		const { listSessions, repository } = setup();
		listSessions.mockRejectedValueOnce(new Error("warehouse down"));

		await expect(repository.listSessions("month")).rejects.toThrow("warehouse down");
		await expect(repository.listSessions("month")).resolves.toEqual([CELL]);
		expect(listSessions).toHaveBeenCalledTimes(2);
	});

	it("keeps the heatmap for an hour by default, since it only changes once a day", async () => {
		let now = 0;
		const listSessions = vi.fn().mockResolvedValue([]);
		const repository = new CachedAppSessionHeatmapRepository(
			{
				listSessions,
				listFilterOptions: vi.fn().mockResolvedValue({ genders: [], skills: [], ages: [] }),
			},
			{ now: () => new Date(now) },
		);
		await repository.listSessions("month");
		now = APP_SESSION_HEATMAP_CACHE_TTL_MS - 1;
		await repository.listSessions("month");
		expect(listSessions).toHaveBeenCalledTimes(1);
		now = APP_SESSION_HEATMAP_CACHE_TTL_MS;
		await repository.listSessions("month");
		expect(listSessions).toHaveBeenCalledTimes(2);
		expect(APP_SESSION_HEATMAP_CACHE_TTL_MS).toBe(60 * 60 * 1000);
	});
});

it("separates cohorts, canonicalizes key order, and deduplicates concurrent queries", async () => {
	const { repository, listSessions } = setup();
	const first = repository.listSessions("month", { gender: "Female", ageMin: 18 });
	expect(repository.listSessions("month", { ageMin: 18, gender: "Female" })).toBe(first);
	await first;
	await repository.listSessions("month", { gender: "Male", ageMin: 18 });
	expect(listSessions).toHaveBeenCalledTimes(2);
	expect(listSessions).toHaveBeenLastCalledWith("month", { gender: "Male", ageMin: 18 });
});
it("bounds the cache and removes expired cohorts", async () => {
	const { repository, listSessions, advance } = setup();
	for (let ageMin = 0; ageMin < 101; ageMin++) await repository.listSessions("month", { ageMin });
	await repository.listSessions("month", { ageMin: 0 });
	expect(listSessions).toHaveBeenCalledTimes(102);
	advance(1000);
	await repository.listSessions("month", { ageMin: 0 });
	expect(listSessions).toHaveBeenCalledTimes(103);
});
it("caches filter options and retries failures", async () => {
	let now = 0;
	const listFilterOptions = vi
		.fn()
		.mockRejectedValueOnce(new Error("down"))
		.mockResolvedValue({ genders: ["Female"], skills: [], ages: [] });
	const repository = new CachedAppSessionHeatmapRepository(
		{ listFilterOptions, listSessions: vi.fn() },
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
