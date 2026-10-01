export interface RefreshAheadEntry<Value> {
	refreshAt: number;
	expiresAt: number;
	pending: Promise<Value> | null;
	settled: { value: Value } | null;
}

export interface RefreshAheadOptions {
	now: () => number;
	ttlMs: number;
}
