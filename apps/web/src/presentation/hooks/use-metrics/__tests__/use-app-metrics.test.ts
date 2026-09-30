import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { useAppMetrics } from "@/presentation/hooks/use-metrics/use-app-metrics";
import { useAppMetricsPeople } from "@/presentation/hooks/use-metrics/use-app-metrics-people";

function stubFetch(data: unknown) {
	const fetchMock = vi
		.fn()
		.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data }) });
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("app metrics hooks", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("loads the weekly metrics", async () => {
		const fetchMock = stubFetch({ targetPercent: 82 });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useAppMetrics(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.data).toEqual({ targetPercent: 82 }));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/metrics");
	});

	it("loads one page of people", async () => {
		const fetchMock = stubFetch({ rows: [], page: 2 });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useAppMetricsPeople(2), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.data).toEqual({ rows: [], page: 2 }));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/metrics/people?page=2");
	});
});
