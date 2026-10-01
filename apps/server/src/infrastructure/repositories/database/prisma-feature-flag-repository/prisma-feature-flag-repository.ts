import type { FeatureFlagRecord, FeatureFlagRepository } from "@market-health-map/core/application";
import type { PrismaClient } from "@server/infrastructure/generated/prisma/client";

export class PrismaFeatureFlagRepository implements FeatureFlagRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async listAll(): Promise<FeatureFlagRecord[]> {
		return this.prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
	}

	async save(record: FeatureFlagRecord): Promise<void> {
		await this.prisma.featureFlag.upsert({
			where: { key: record.key },
			create: record,
			update: { enabled: record.enabled, updatedBy: record.updatedBy, updatedAt: record.updatedAt },
		});
	}
}
