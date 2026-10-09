import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { withStatsTimeZone } from "@/infrastructure/time/stats-day";
import {
	metricDrillDownPath,
	metricDrillDownQueryKey,
	useMetricDrillDown,
} from "@/presentation/hooks/use-metric/use-metric-drill-down";

function stubFetch(data: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: async () => ({ data }),
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("metricDrillDownPath", () => {
	it("includes measure, range, slice, scope and departments", () => {
		const path = metricDrillDownPath({
			measure: "games",
			range: "90d",
			slice: "market",
			marketId: "miami",
			facilityId: "a",
			department: "magic",
			segment: "department",
			departments: ["magic", "organizers"],
		});
		expect(path).toContain("/api/v1/metric-drill-down?");
		expect(path).toContain("measure=games");
		expect(path).toContain("range=90d");
		expect(path).toContain("slice=market");
		expect(path).toContain("marketId=miami");
		expect(path).toContain("facilityId=a");
		expect(path).toContain("department=magic");
		expect(path).toContain("segment=department");
		expect(path).toContain("departments=magic%2Corganizers");
		expect(path).toContain("tz=");
	});

	it("omits optional scope and department filters when unset", () => {
		const path = metricDrillDownPath({
			measure: "active-facilities",
			range: "7d",
			slice: "facility",
			departments: [],
		});
		expect(path).toContain("measure=active-facilities");
		expect(path).toContain("range=7d");
		expect(path).not.toContain("marketId=");
		expect(path).not.toContain("facilityId=");
		expect(path).not.toContain("department=");
		expect(path).not.toContain("segment=");
		expect(path).not.toContain("departments=");
		expect(
			metricDrillDownPath({
				measure: "unique-players",
				range: "12m",
				slice: "department",
			}),
		).toContain("measure=unique-players");
	});
});

describe("metricDrillDownQueryKey", () => {
	it("includes the enabled flag and normalized departments", () => {
		expect(
			metricDrillDownQueryKey({
				measure: "games",
				range: "28d",
				slice: "market",
				departments: ["partnerships", "magic", "organizers"],
				enabled: true,
			}),
		).toEqual(
			expect.arrayContaining([
				"metric-drill-down",
				"games",
				"28d",
				"market",
				"all",
				"all",
				"all",
				"all",
				true,
			]),
		);
		expect(
			metricDrillDownQueryKey({
				measure: "games",
				range: "28d",
				slice: "facility",
				marketId: "miami",
				facilityId: "a",
				department: "magic",
				departments: ["magic"],
				enabled: false,
			}),
		).toEqual(expect.arrayContaining(["miami", "a", "magic", "magic", false]));
	});
});

describe("useMetricDrillDown", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the drill-down view when enabled", async () => {
		const fetchMock = stubFetch({
			total: 10,
			rows: [],
			start: "2026-09-10",
			end: "2026-10-07",
			measure: "games",
			range: "28d",
			kind: "count",
		});
		const { Wrapper } = createQueryWrapper();
		const { result } = renderHook(
			() =>
				useMetricDrillDown({
					measure: "games",
					range: "28d",
					slice: "market",
				}),
			{ wrapper: Wrapper },
		);
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(10);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			withStatsTimeZone("/api/v1/metric-drill-down?measure=games&range=28d&slice=market"),
		);
	});

	it("skips the request while disabled", async () => {
		const fetchMock = stubFetch({ total: 0, rows: [] });
		const { Wrapper } = createQueryWrapper();
		const { result } = renderHook(
			() =>
				useMetricDrillDown({
					measure: "games",
					range: "28d",
					slice: "market",
					enabled: false,
				}),
			{ wrapper: Wrapper },
		);
		expect(result.current.fetchStatus).toBe("idle");
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

it("sends calendar grain and separates cached day, week and month views", () => {
	const input = { measure: "games", range: "12m", slice: "time", enabled: true } as const;
	expect(metricDrillDownPath({ ...input, grain: "week" })).toContain("grain=week");
	expect(metricDrillDownQueryKey({ ...input, grain: "day" })).not.toEqual(
		metricDrillDownQueryKey({ ...input, grain: "week" }),
	);
	expect(metricDrillDownQueryKey({ ...input, grain: "month" })).not.toEqual(
		metricDrillDownQueryKey({ ...input, grain: "week" }),
	);
});

it("sends the comparison and separates cached comparison windows", () => {
	const input = { measure: "games", range: "28d", slice: "market", enabled: true } as const;
	expect(metricDrillDownPath({ ...input, comparison: "year" })).toContain("comparison=year");
	expect(metricDrillDownQueryKey({ ...input, comparison: "week" })).not.toEqual(
		metricDrillDownQueryKey({ ...input, comparison: "month" }),
	);
	expect(metricDrillDownQueryKey({ ...input, comparison: "year" })).not.toEqual(
		metricDrillDownQueryKey({ ...input, comparison: "month" }),
	);
});
