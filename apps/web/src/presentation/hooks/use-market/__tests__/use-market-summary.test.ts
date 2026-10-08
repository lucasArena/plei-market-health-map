import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper } from "@/application/test/query-wrapper";
import {
	marketGameInsightsQueryKey,
	useMarketGameInsights,
} from "@/presentation/hooks/use-market/use-market-game-insights";
import {
	marketPlayerStatsQueryKey,
	useMarketPlayerStats,
} from "@/presentation/hooks/use-market/use-market-player-stats";
import {
	marketDepartmentsKey,
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
		expect(client.getQueryState(marketSummaryQueryKey())?.isInvalidated).toBe(false);
	});

	it("fetches market player analytics independently", async () => {
		const fetchMock = stubFetch({ uniquePlayersLast28Days: 900 });
		const { Wrapper } = createQueryWrapper();

		const { result } = renderHook(() => useMarketPlayerStats(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/market-summary/players");
		expect(marketPlayerStatsQueryKey()).toEqual(["market-summary", "players", "all"]);
	});

	it("caches each market scope separately and passes the market as a query parameter", async () => {
		const fetchMock = stubFetch({ scope: { facilityCount: 2 } });
		const { client, Wrapper } = createQueryWrapper();

		const summary = renderHook(() => useMarketSummary("philly & co"), { wrapper: Wrapper });
		const players = renderHook(() => useMarketPlayerStats("philly & co"), { wrapper: Wrapper });

		await waitFor(() => expect(summary.result.current.isSuccess).toBe(true));
		await waitFor(() => expect(players.result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
			"/api/v1/market-summary?market=philly%20%26%20co",
			"/api/v1/market-summary/players?market=philly%20%26%20co",
		]);
		expect(client.getQueryData(marketSummaryQueryKey("philly & co"))).toEqual({
			scope: { facilityCount: 2 },
		});
		expect(client.getQueryData(marketSummaryQueryKey())).toBeUndefined();
	});

	it("does not fetch while disabled", () => {
		const fetchMock = stubFetch({});
		const { Wrapper } = createQueryWrapper();

		renderHook(() => useMarketSummary(null, false), { wrapper: Wrapper });
		renderHook(() => useMarketPlayerStats(null, false), { wrapper: Wrapper });
		renderHook(() => useMarketGameInsights(null, "week", false), { wrapper: Wrapper });

		expect(fetchMock).not.toHaveBeenCalled();
	});
});

it("loads market insights separately and caches them by scope", async () => {
	const fetchMock = stubFetch([]);
	const { Wrapper } = createQueryWrapper();
	const first = renderHook(() => useMarketGameInsights("philly & co", "week", true), {
		wrapper: Wrapper,
	});
	await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
	first.unmount();
	renderHook(() => useMarketGameInsights("philly & co", "week", true), { wrapper: Wrapper });
	expect(fetchMock).toHaveBeenCalledOnce();
	const month = renderHook(() => useMarketGameInsights(null, "month", true), { wrapper: Wrapper });
	await waitFor(() => expect(month.result.current.isSuccess).toBe(true));
	expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
		"/api/v1/market-summary/insights?period=week&market=philly+%26+co",
		"/api/v1/market-summary/insights?period=month",
	]);
	vi.unstubAllGlobals();
});

describe("market summary department filter", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("keys and requests the summary and insights per department filter, never the players", async () => {
		const fetchMock = stubFetch([]);
		const { client, Wrapper } = createQueryWrapper();

		const summary = renderHook(
			() => useMarketSummary("philly", true, ["organizers", "magic", "magic"]),
			{ wrapper: Wrapper },
		);
		const insights = renderHook(() => useMarketGameInsights(null, "week", true, ["partnerships"]), {
			wrapper: Wrapper,
		});

		await waitFor(() => expect(summary.result.current.isSuccess).toBe(true));
		await waitFor(() => expect(insights.result.current.isSuccess).toBe(true));
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			"/api/v1/market-summary?market=philly&departments=magic%2Corganizers",
			"/api/v1/market-summary/insights?period=week&departments=partnerships",
		]);
		expect(client.getQueryData(marketSummaryQueryKey("philly", ["magic", "organizers"]))).toEqual(
			[],
		);
		expect(client.getQueryData(marketSummaryQueryKey("philly"))).toBeUndefined();
		expect(marketPlayerStatsQueryKey("philly")).toEqual(["market-summary", "players", "philly"]);
	});

	it("shares one cache entry for no filter and for every department", () => {
		expect(marketSummaryQueryKey(null, ["magic", "organizers", "partnerships"])).toEqual(
			marketSummaryQueryKey(),
		);
		expect(marketSummaryQueryKey()).toEqual(["market-summary", "reservations", "all", "all"]);
		expect(marketGameInsightsQueryKey("houston", "month", ["organizers"])).toEqual([
			"market-summary",
			"insights",
			"houston",
			"month",
			"organizers",
		]);
		expect(marketGameInsightsQueryKey("houston", "month")).not.toEqual(
			marketGameInsightsQueryKey("houston", "month", ["organizers"]),
		);
		expect(marketDepartmentsKey(["partnerships", "magic"])).toBe("magic,partnerships");
	});
});
