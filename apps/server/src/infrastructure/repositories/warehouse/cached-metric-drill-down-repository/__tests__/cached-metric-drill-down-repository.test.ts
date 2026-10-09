import type { MetricDrillDownRepository } from "@market-health-map/core/application";
import {
	CachedMetricDrillDownRepository,
	METRIC_DRILL_DOWN_CACHE_TTL_MS,
	METRIC_DRILL_DOWN_LONG_RANGE_CACHE_TTL_MS,
} from "@server/infrastructure/repositories/warehouse/cached-metric-drill-down-repository/cached-metric-drill-down-repository";

const view = {
	total: 1,
	rows: [],
	start: "2026-09-10",
	end: "2026-10-07",
	measure: "games" as const,
	range: "28d" as const,
	kind: "count" as const,
};

function setup(ttlMs = 1000, longRangeTtlMs = 2000) {
	let now = 0;
	const inner: MetricDrillDownRepository = {
		group: vi.fn().mockResolvedValue(view),
	};
	const repository = new CachedMetricDrillDownRepository(
		inner,
		{ now: () => new Date(now) },
		ttlMs,
		longRangeTtlMs,
	);
	return { inner, repository, advance: (ms: number) => (now += ms) };
}

describe("CachedMetricDrillDownRepository", () => {
	it("keys the cache by measure, range, grain, scope, departments and today", async () => {
		const { inner, repository } = setup();
		const query = {
			measure: "games" as const,
			range: "28d" as const,
			slice: "market" as const,
			departments: ["magic" as const],
			today: "2026-10-08",
			grain: "range" as const,
			marketId: "miami",
		};
		await expect(repository.group(query)).resolves.toBe(view);
		await expect(repository.group(query)).resolves.toBe(view);
		expect(inner.group).toHaveBeenCalledTimes(1);
		await repository.group({ ...query, range: "90d" });
		expect(inner.group).toHaveBeenCalledTimes(2);
		for (const grain of ["day", "week", "month"] as const) {
			await repository.group({ ...query, slice: "time", grain });
			await repository.group({ ...query, slice: "time", grain });
		}
		expect(inner.group).toHaveBeenCalledTimes(5);
		expect(METRIC_DRILL_DOWN_LONG_RANGE_CACHE_TTL_MS).toBeGreaterThan(
			METRIC_DRILL_DOWN_CACHE_TTL_MS,
		);
	});

	it("evicts expired entries and caps the cache size", async () => {
		const { inner, repository, advance } = setup(1, 1);
		await repository.group({
			measure: "games",
			range: "7d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		advance(2);
		await repository.group({
			measure: "games",
			range: "7d",
			slice: "market",
			departments: [],
			today: "2026-10-08",
			grain: "range",
		});
		expect(inner.group).toHaveBeenCalledTimes(2);
		for (let index = 0; index < 101; index += 1) {
			await repository.group({
				measure: "games",
				range: "6m",
				slice: "facility",
				departments: [],
				today: `2026-10-${String((index % 28) + 1).padStart(2, "0")}`,
				grain: "range",
				facilityId: String(index),
			});
		}
		expect(inner.group).toHaveBeenCalled();
	});
});
