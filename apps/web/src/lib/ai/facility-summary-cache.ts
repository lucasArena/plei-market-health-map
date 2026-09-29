import type { FacilityDetailView } from "@market-health-map/application";

const summaries = new Map<string, string>();

export function summaryCacheKey({ facility, stats }: FacilityDetailView, locale: string): string {
	return `${facility.id}:${stats.weekStart}:${locale}`;
}

export function readCachedSummary(key: string): string | null {
	return summaries.get(key) ?? null;
}

export function writeCachedSummary(key: string, summary: string): void {
	summaries.set(key, summary);
}

export function clearCachedSummaries(): void {
	summaries.clear();
}
