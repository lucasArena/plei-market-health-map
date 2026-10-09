import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import { statsDayKey, withStatsTimeZone } from "@/infrastructure/time/stats-day";
import {
	marketAudienceQueryKey,
	useMarketAudience,
} from "@/presentation/hooks/use-market/use-market-audience";

function stubFetch(data: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: async () => ({ data }),
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("useMarketAudience", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the app audience for all markets and keys it by scope and day", async () => {
		const fetchMock = stubFetch({ periods: {} });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useMarketAudience(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe(withStatsTimeZone("/api/v1/market-summary/audience"));
		expect(marketAudienceQueryKey()).toEqual(["market-summary", "audience", "all", statsDayKey()]);
	});

	it("passes the market and waits while disabled", async () => {
		const fetchMock = stubFetch({ periods: {} });
		const { Wrapper } = createQueryWrapper();

		const disabled = renderHook(() => useMarketAudience("12", false), { wrapper: Wrapper });
		expect(disabled.result.current.fetchStatus).toBe("idle");
		expect(fetchMock).not.toHaveBeenCalled();

		const { result } = renderHook(() => useMarketAudience("12"), { wrapper: Wrapper });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			withStatsTimeZone("/api/v1/market-summary/audience?market=12"),
		);
	});
});
