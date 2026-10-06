import type { Clock, PlaceSearch, PlaceView } from "@market-health-map/core/application";
import type { CachedPlaceSearchOptions } from "@server/infrastructure/providers/photon/cached-place-search/cached-place-search.types";
import {
	isExpired,
	remember,
} from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry";
import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export const PLACE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const PLACE_CACHE_MAX_ENTRIES = 500;

export class CachedPlaceSearch implements PlaceSearch {
	private readonly cache = new Map<string, CacheEntry<PlaceView[]>>();

	constructor(
		private readonly inner: PlaceSearch,
		private readonly clock: Clock,
		private readonly options: CachedPlaceSearchOptions = {},
	) {}

	search(query: string, limit: number): Promise<PlaceView[]> {
		const now = this.clock.now().getTime();
		const key = `${limit}:${query}`;
		const cached = this.cache.get(key);
		if (cached && !isExpired(cached, now)) return cached.value;
		if (this.cache.size >= (this.options.maxEntries ?? PLACE_CACHE_MAX_ENTRIES)) {
			this.cache.delete(this.cache.keys().next().value as string);
		}
		const ttl = this.options.ttlMs ?? PLACE_CACHE_TTL_MS;
		return remember(this.cache, key, this.inner.search(query, limit), now + ttl);
	}
}
