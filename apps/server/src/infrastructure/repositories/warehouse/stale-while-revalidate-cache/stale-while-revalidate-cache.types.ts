export interface StaleWhileRevalidateEntry<Value> {
	freshUntil: number;
	staleUntil: number;
	pending: Promise<Value> | null;
	settled: { value: Value } | null;
}

export interface StaleWhileRevalidateOptions {
	now: () => number;
	ttlMs: number;
	maxStaleMs: number;
}
