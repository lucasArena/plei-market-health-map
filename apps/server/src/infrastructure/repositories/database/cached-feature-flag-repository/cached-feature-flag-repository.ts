import type {
	Clock,
	FeatureFlagRecord,
	FeatureFlagRepository,
} from "@market-health-map/core/application";
import type { CachedFeatureFlags } from "@server/infrastructure/repositories/database/cached-feature-flag-repository/cached-feature-flag-repository.types";

export const FEATURE_FLAG_CACHE_TTL_MS = 30 * 1000;

export class CachedFeatureFlagRepository implements FeatureFlagRepository {
	private cached: CachedFeatureFlags | null = null;

	constructor(
		private readonly inner: FeatureFlagRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = FEATURE_FLAG_CACHE_TTL_MS,
	) {}

	listAll(): Promise<FeatureFlagRecord[]> {
		const now = this.clock.now().getTime();
		const isExpired = this.cached !== null && now >= this.cached.expiresAt;
		if (!this.cached || isExpired) {
			const fromDatabase = this.inner.listAll();
			const entry = { expiresAt: now + this.ttlMs, value: fromDatabase };
			this.cached = entry;
			fromDatabase.catch(() => {
				if (this.cached === entry) this.cached = null;
			});
			return fromDatabase;
		}
		return this.cached.value;
	}

	async save(record: FeatureFlagRecord): Promise<void> {
		await this.inner.save(record);
		this.cached = null;
	}
}
