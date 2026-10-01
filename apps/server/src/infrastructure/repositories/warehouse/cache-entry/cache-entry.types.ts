export interface CacheEntry<Value> {
	expiresAt: number;
	value: Promise<Value>;
}
