import type { FacilityDetailView } from "@market-health-map/core/application";
import type { ResolveStorage } from "@/infrastructure/cache/local-storage/facility-summary/facility-summary-cache.types";

export const FACILITY_SUMMARY_STORAGE_PREFIX = "market-health-map:facility-summary:";

function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export class FacilitySummaryCache {
	constructor(private readonly resolveStorage: ResolveStorage = browserStorage) {}

	keyFor({ facility, stats }: FacilityDetailView, locale: string): string {
		return `v3:${facility.id}:${stats.weekStart}:${locale}`;
	}

	read(key: string): string | null {
		try {
			return this.resolveStorage()?.getItem(this.storageKey(key)) ?? null;
		} catch {
			return null;
		}
	}

	write(key: string, summary: string): void {
		try {
			const storage = this.resolveStorage();
			if (!storage) return;
			this.removeOtherWeeks(storage, key);
			storage.setItem(this.storageKey(key), summary);
		} catch {
			return;
		}
	}

	clear(): void {
		try {
			const storage = this.resolveStorage();
			if (!storage) return;
			for (const storageKey of this.ownKeys(storage)) storage.removeItem(storageKey);
		} catch {
			return;
		}
	}

	private removeOtherWeeks(storage: Storage, key: string): void {
		const [, facilityId, , locale] = key.split(":");
		const current = this.storageKey(key);
		for (const storageKey of this.ownKeys(storage)) {
			const [, otherFacility, , otherLocale] = storageKey
				.slice(FACILITY_SUMMARY_STORAGE_PREFIX.length)
				.split(":");
			if (storageKey !== current && otherFacility === facilityId && otherLocale === locale) {
				storage.removeItem(storageKey);
			}
		}
	}

	private ownKeys(storage: Storage): string[] {
		return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
			(storageKey): storageKey is string =>
				storageKey?.startsWith(FACILITY_SUMMARY_STORAGE_PREFIX) ?? false,
		);
	}

	private storageKey(key: string): string {
		return `${FACILITY_SUMMARY_STORAGE_PREFIX}${key}`;
	}
}

export const facilitySummaryCache = new FacilitySummaryCache();
