import type { FeatureFlagRecord } from "@core/application/dtos/feature-flags-dto.types";
import type { FeatureFlagRepository } from "@core/application/repositories/feature-flag-repository.types";

export class InMemoryFeatureFlagRepository implements FeatureFlagRepository {
	readonly records = new Map<string, FeatureFlagRecord>();

	constructor(seed: FeatureFlagRecord[] = []) {
		for (const record of seed) this.records.set(record.key, record);
	}

	async listAll(): Promise<FeatureFlagRecord[]> {
		return [...this.records.values()];
	}

	async save(record: FeatureFlagRecord): Promise<void> {
		this.records.set(record.key, record);
	}
}
