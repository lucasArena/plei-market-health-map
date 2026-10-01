import type {
	RefreshAheadEntry,
	RefreshAheadOptions,
} from "@server/infrastructure/repositories/warehouse/refresh-ahead-cache/refresh-ahead-cache.types";

export const REFRESH_AHEAD_RATIO = 0.8;

export class RefreshAheadCache<Value> {
	private readonly entries = new Map<string, RefreshAheadEntry<Value>>();

	constructor(private readonly options: RefreshAheadOptions) {}

	get(key: string, load: () => Promise<Value>): Promise<Value> {
		const now = this.options.now();
		const entry = this.entries.get(key);
		const usable = entry?.settled && now < entry.expiresAt ? entry : null;
		if (usable?.settled) {
			if (now >= usable.refreshAt && !usable.pending) {
				this.refresh(key, usable, load).catch(() => undefined);
			}
			return Promise.resolve(usable.settled.value);
		}
		if (entry?.pending) return entry.pending;
		const fresh: RefreshAheadEntry<Value> = {
			refreshAt: 0,
			expiresAt: 0,
			pending: null,
			settled: null,
		};
		this.entries.set(key, fresh);
		return this.refresh(key, fresh, load);
	}

	private refresh(
		key: string,
		entry: RefreshAheadEntry<Value>,
		load: () => Promise<Value>,
	): Promise<Value> {
		const pending = load().then(
			(value) => {
				const loadedAt = this.options.now();
				entry.settled = { value };
				entry.refreshAt = loadedAt + this.options.ttlMs * REFRESH_AHEAD_RATIO;
				entry.expiresAt = loadedAt + this.options.ttlMs;
				entry.pending = null;
				return value;
			},
			(error: unknown) => {
				entry.pending = null;
				if (!entry.settled || this.options.now() >= entry.expiresAt) this.entries.delete(key);
				throw error;
			},
		);
		entry.pending = pending;
		return pending;
	}
}
