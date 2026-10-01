import { InMemoryFeatureFlagRepository } from "@market-health-map/core/application/testing";
import { CachedFeatureFlagRepository } from "@server/infrastructure/repositories/database/cached-feature-flag-repository/cached-feature-flag-repository";

const RECORD = {
	key: "new-panel",
	enabled: true,
	updatedBy: "lucas@plei.com",
	updatedAt: new Date("2026-10-01T10:00:00Z"),
};

function setup() {
	let now = 0;
	const inner = new InMemoryFeatureFlagRepository([RECORD]);
	const listAll = vi.spyOn(inner, "listAll");
	const repository = new CachedFeatureFlagRepository(inner, { now: () => new Date(now) }, 1000);
	return { inner, listAll, repository, advance: (ms: number) => (now += ms) };
}

describe("CachedFeatureFlagRepository", () => {
	it("serves the flags from memory until they expire", async () => {
		const { listAll, repository, advance } = setup();

		await repository.listAll();
		advance(999);
		await expect(repository.listAll()).resolves.toEqual([RECORD]);
		expect(listAll).toHaveBeenCalledTimes(1);

		advance(1);
		await repository.listAll();
		expect(listAll).toHaveBeenCalledTimes(2);
	});

	it("reads the database again right after a switch", async () => {
		const { listAll, repository } = setup();
		await repository.listAll();

		await repository.save({ ...RECORD, enabled: false });

		await expect(repository.listAll()).resolves.toEqual([{ ...RECORD, enabled: false }]);
		expect(listAll).toHaveBeenCalledTimes(2);
	});

	it("does not keep failed reads", async () => {
		const { listAll, repository } = setup();
		listAll.mockRejectedValueOnce(new Error("database down"));

		await expect(repository.listAll()).rejects.toThrow("database down");
		await expect(repository.listAll()).resolves.toEqual([RECORD]);
	});

	it("uses a thirty-second cache by default", async () => {
		const inner = new InMemoryFeatureFlagRepository();
		const listAll = vi.spyOn(inner, "listAll");
		const repository = new CachedFeatureFlagRepository(inner, { now: () => new Date(29_999) });

		await repository.listAll();
		await repository.listAll();
		expect(listAll).toHaveBeenCalledTimes(1);
	});
});
