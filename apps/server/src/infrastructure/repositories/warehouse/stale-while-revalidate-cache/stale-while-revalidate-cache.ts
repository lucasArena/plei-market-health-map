import type {
	StaleWhileRevalidateEntry,
	StaleWhileRevalidateOptions,
} from "@server/infrastructure/repositories/warehouse/stale-while-revalidate-cache/stale-while-revalidate-cache.types";

export const DEFAULT_MAX_STALE_MS = 60 * 60 * 1000;

export class StaleWhileRevalidateCache<Value> {
	private readonly entries = new Map<string, StaleWhileRevalidateEntry<Value>>();

	constructor(private readonly options: StaleWhileRevalidateOptions) {}

	get(key: string, load: () => Promise<Value>): Promise<Value> {
		const now = this.options.now();
		const entry = this.entries.get(key);
		if (entry?.settled && now < entry.freshUntil) return Promise.resolve(entry.settled.value);
		if (entry?.pending && !entry.settled) return entry.pending;
		if (entry?.settled && now < entry.staleUntil) {
			if (!entry.pending) this.refresh(key, entry, load).catch(() => undefined);
			return Promise.resolve(entry.settled.value);
		}
		const fresh: StaleWhileRevalidateEntry<Value> = {
			freshUntil: 0,
			staleUntil: 0,
			pending: null,
			settled: null,
		};
		this.entries.set(key, fresh);
		return this.refresh(key, fresh, load);
	}

	private refresh(
		key: string,
		entry: StaleWhileRevalidateEntry<Value>,
		load: () => Promise<Value>,
	): Promise<Value> {
		const pending = load().then(
			(value) => {
				const loadedAt = this.options.now();
				entry.settled = { value };
				entry.freshUntil = loadedAt + this.options.ttlMs;
				entry.staleUntil = loadedAt + this.options.ttlMs + this.options.maxStaleMs;
				entry.pending = null;
				return value;
			},
			(error: unknown) => {
				entry.pending = null;
				if (!entry.settled) this.entries.delete(key);
				throw error;
			},
		);
		entry.pending = pending;
		return pending;
	}
}
