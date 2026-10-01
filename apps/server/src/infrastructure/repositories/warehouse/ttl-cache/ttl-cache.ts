import type {
	TtlCacheEntry,
	TtlCacheOptions,
} from "@server/infrastructure/repositories/warehouse/ttl-cache/ttl-cache.types";

export class TtlCache<Value> {
	private readonly entries = new Map<string, TtlCacheEntry<Value>>();

	constructor(private readonly options: TtlCacheOptions) {}

	get(key: string, load: () => Promise<Value>): Promise<Value> {
		const cached = this.entries.get(key);
		const isExpired = cached !== undefined && this.options.now() >= cached.expiresAt;
		if (!cached || isExpired) return this.load(key, load);
		return cached.value;
	}

	private load(key: string, load: () => Promise<Value>): Promise<Value> {
		const entry = { expiresAt: this.options.now() + this.options.ttlMs, value: load() };
		this.entries.set(key, entry);
		entry.value.catch(() => {
			if (this.entries.get(key) === entry) this.entries.delete(key);
		});
		return entry.value;
	}
}
