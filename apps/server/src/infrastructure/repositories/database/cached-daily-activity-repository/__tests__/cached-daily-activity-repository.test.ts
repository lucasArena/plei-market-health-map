import { CachedDailyActivityRepository } from "@server/infrastructure/repositories/database/cached-daily-activity-repository/cached-daily-activity-repository";

function setup() {
	let now = 0;
	const inner = {
		record: vi.fn().mockResolvedValue(undefined),
		listBetween: vi.fn().mockResolvedValue([]),
		deleteBefore: vi.fn().mockResolvedValue(undefined),
	};
	const repository = new CachedDailyActivityRepository(inner, { now: () => new Date(now) }, 1000);
	return { inner, repository, advance: (ms: number) => (now += ms) };
}

describe("CachedDailyActivityRepository", () => {
	it("serves the same range from memory until it expires", async () => {
		const { inner, repository, advance } = setup();

		await repository.listBetween("2026-09-01", "2026-09-30");
		advance(999);
		await repository.listBetween("2026-09-01", "2026-09-30");
		await repository.listBetween("2026-09-28", "2026-09-30");
		expect(inner.listBetween).toHaveBeenCalledTimes(2);

		advance(1);
		await repository.listBetween("2026-09-01", "2026-09-30");
		expect(inner.listBetween).toHaveBeenCalledTimes(3);
	});

	it("does not cache failures and passes writes through", async () => {
		const { inner, repository } = setup();
		inner.listBetween.mockRejectedValueOnce(new Error("asleep"));

		await expect(repository.listBetween("a", "b")).rejects.toThrow("asleep");
		await repository.listBetween("a", "b");
		await repository.record({} as never);
		await repository.deleteBefore("2026-04-01");

		expect(inner.listBetween).toHaveBeenCalledTimes(2);
		expect(inner.record).toHaveBeenCalled();
		expect(inner.deleteBefore).toHaveBeenCalledWith("2026-04-01");
	});

	it("caches for five minutes by default", async () => {
		const inner = {
			record: vi.fn(),
			listBetween: vi.fn().mockResolvedValue([]),
			deleteBefore: vi.fn(),
		};
		const repository = new CachedDailyActivityRepository(inner, { now: () => new Date(0) });
		await repository.listBetween("a", "b");
		await repository.listBetween("a", "b");
		expect(inner.listBetween).toHaveBeenCalledTimes(1);
	});
});
