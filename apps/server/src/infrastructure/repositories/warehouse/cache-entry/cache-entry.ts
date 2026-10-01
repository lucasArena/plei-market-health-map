import type { CacheEntry } from "@server/infrastructure/repositories/warehouse/cache-entry/cache-entry.types";

export function isExpired<Value>(entry: CacheEntry<Value>, now: number): boolean {
	return now >= entry.expiresAt;
}

export function remember<Value>(
	cache: Map<string, CacheEntry<Value>>,
	key: string,
	value: Promise<Value>,
	expiresAt: number,
): Promise<Value> {
	const entry = { expiresAt, value };
	cache.set(key, entry);
	value.catch(() => {
		if (cache.get(key) === entry) cache.delete(key);
	});
	return value;
}
