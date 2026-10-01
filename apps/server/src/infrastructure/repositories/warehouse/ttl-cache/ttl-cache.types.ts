export interface TtlCacheEntry<Value> {
	expiresAt: number;
	value: Promise<Value>;
}

export interface TtlCacheOptions {
	now: () => number;
	ttlMs: number;
}
