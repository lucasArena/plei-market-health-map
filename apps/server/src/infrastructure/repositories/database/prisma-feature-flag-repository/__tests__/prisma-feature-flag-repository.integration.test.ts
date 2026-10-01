import { getPrismaClient } from "@server/infrastructure/repositories/database/prisma-client/prisma-client";
import { PrismaFeatureFlagRepository } from "@server/infrastructure/repositories/database/prisma-feature-flag-repository/prisma-feature-flag-repository";

const databaseUrl = process.env.DATABASE_URL;
const prisma = databaseUrl ? getPrismaClient(databaseUrl) : null;
const KEY = `integration-${Date.now()}`;

afterAll(async () => {
	await prisma?.featureFlag.deleteMany({ where: { key: KEY } });
});

describe.skipIf(!prisma)("PrismaFeatureFlagRepository", () => {
	it("creates a flag on the first switch and updates it after", async () => {
		const repository = new PrismaFeatureFlagRepository(prisma as NonNullable<typeof prisma>);

		await repository.save({
			key: KEY,
			enabled: true,
			updatedBy: "integration@plei.com",
			updatedAt: new Date("2026-10-01T10:00:00Z"),
		});
		await repository.save({
			key: KEY,
			enabled: false,
			updatedBy: "other@plei.com",
			updatedAt: new Date("2026-10-01T11:00:00Z"),
		});

		const saved = (await repository.listAll()).find((record) => record.key === KEY);
		expect(saved).toEqual({
			key: KEY,
			enabled: false,
			updatedBy: "other@plei.com",
			updatedAt: new Date("2026-10-01T11:00:00Z"),
		});
	});
});
