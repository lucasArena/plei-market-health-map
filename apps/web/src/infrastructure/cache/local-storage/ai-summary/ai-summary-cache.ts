import type { ResolveStorage } from "@/infrastructure/cache/local-storage/ai-summary/ai-summary-cache.types";

export const AI_SUMMARY_STORAGE_PREFIX = "market-health-map:ai-summary:";

function browserStorage(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export class AiSummaryCache {
	constructor(private readonly resolveStorage: ResolveStorage = browserStorage) {}

	keyFor(subject: string, weekStart: string, locale: string): string {
		return `v4:${subject.replaceAll(":", "-")}:${weekStart}:${locale}`;
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
		const [, subject, , locale] = key.split(":");
		const current = this.storageKey(key);
		for (const storageKey of this.ownKeys(storage)) {
			const [, otherSubject, , otherLocale] = storageKey
				.slice(AI_SUMMARY_STORAGE_PREFIX.length)
				.split(":");
			if (storageKey !== current && otherSubject === subject && otherLocale === locale) {
				storage.removeItem(storageKey);
			}
		}
	}

	private ownKeys(storage: Storage): string[] {
		return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
			(storageKey): storageKey is string =>
				storageKey?.startsWith(AI_SUMMARY_STORAGE_PREFIX) ?? false,
		);
	}

	private storageKey(key: string): string {
		return `${AI_SUMMARY_STORAGE_PREFIX}${key}`;
	}
}

export const aiSummaryCache = new AiSummaryCache();
