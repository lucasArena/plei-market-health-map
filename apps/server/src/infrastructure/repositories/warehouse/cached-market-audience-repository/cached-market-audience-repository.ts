import type {
	Clock,
	MarketAudienceCounts,
	MarketAudienceRepository,
} from "@market-health-map/core/application";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const MARKET_AUDIENCE_CACHE_TTL_MS = 5 * 60 * 1000;

export const MARKET_AUDIENCE_CACHE_MAX_ENTRIES = 100;

export class CachedMarketAudienceRepository implements MarketAudienceRepository {
	private readonly cache = new Map<string, CacheEntry<MarketAudienceCounts>>();

	constructor(
		private readonly inner: MarketAudienceRepository,
		private readonly clock: Clock,
		private readonly ttlMs: number = MARKET_AUDIENCE_CACHE_TTL_MS,
	) {}

	getAudience(marketId: string | null, today: string): Promise<MarketAudienceCounts> {
		const now = this.clock.now().getTime();
		const key = JSON.stringify([today, marketId]);
		const cached = this.cache.get(key);
		if (cached && !isExpired(cached, now)) return cached.value;
		for (const [entryKey, entry] of this.cache) {
			if (isExpired(entry, now)) this.cache.delete(entryKey);
		}
		if (this.cache.size >= MARKET_AUDIENCE_CACHE_MAX_ENTRIES) {
			this.cache.delete(this.cache.keys().next().value as string);
		}
		return remember(this.cache, key, this.inner.getAudience(marketId, today), now + this.ttlMs);
	}
}
