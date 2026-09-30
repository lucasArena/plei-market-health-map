import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import {
	marketPlayerStatsQueryKey,
	useMarketPlayerStats,
} from "@/presentation/hooks/use-market/use-market-player-stats";
import {
	marketSummaryQueryKey,
	useMarketSummary,
} from "@/presentation/hooks/use-market/use-market-summary";

function stubFetch(data: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: async () => ({ data }),
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

describe("market summary hooks", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("fetches the market summary once and keeps it for the session", async () => {
		const fetchMock = stubFetch({ scope: { facilityCount: 3 } });
		const { client, Wrapper } = createQueryWrapper();

		const first = renderHook(() => useMarketSummary(), { wrapper: Wrapper });
		await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
		first.unmount();
		const second = renderHook(() => useMarketSummary(), { wrapper: Wrapper });

		expect(second.result.current.data).toEqual({ scope: { facilityCount: 3 } });
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/market-summary");
		expect(client.getQueryState(marketSummaryQueryKey)?.isInvalidated).toBe(false);
	});

	it("fetches market player analytics independently", async () => {
		const fetchMock = stubFetch({ uniquePlayersLast28Days: 900 });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useMarketPlayerStats(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/market-summary/players");
		expect(marketPlayerStatsQueryKey).toEqual(["market-summary", "players"]);
	});
});
