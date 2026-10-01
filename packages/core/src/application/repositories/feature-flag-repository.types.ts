import type { FeatureFlagRecord } from "@core/application/dtos/feature-flags-dto.types";

export interface FeatureFlagRepository {
	listAll(): Promise<FeatureFlagRecord[]>;
	save(record: FeatureFlagRecord): Promise<void>;
}
