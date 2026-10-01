import { MemoryFeatureFlagRepository } from "@server/infrastructure/repositories/sample/memory-feature-flag-repository/memory-feature-flag-repository";

describe("MemoryFeatureFlagRepository", () => {
	it("keeps flags in memory when no database is configured", async () => {
		const repository = new MemoryFeatureFlagRepository();
		const record = {
			key: "new-panel",
			enabled: true,
			updatedBy: "lucas@plei.com",
			updatedAt: new Date("2026-10-01T10:00:00Z"),
		};

		await repository.save(record);

		await expect(repository.listAll()).resolves.toEqual([record]);
	});
});
