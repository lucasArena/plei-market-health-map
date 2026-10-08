import { QueryClient } from "@tanstack/react-query";
import { withStatsTimeZone } from "@/infrastructure/time/stats-day";
import { prefetchMarketSummary } from "@/presentation/hooks/use-market/prefetch-market-summary";

describe("prefetchMarketSummary", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("loads the summary, players and insights one after another and never twice", async () => {
		const order: string[] = [];
		let inFlight = 0;
		let maxInFlight = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string) => {
				order.push(url);
				inFlight += 1;
				maxInFlight = Math.max(maxInFlight, inFlight);
				await Promise.resolve();
				inFlight -= 1;
				return { ok: true, status: 200, json: async () => ({ data: {} }) };
			}),
		);
		const client = new QueryClient();

		await prefetchMarketSummary(client, "m 1");
		await prefetchMarketSummary(client, "m 1");

		expect(order).toEqual([
			withStatsTimeZone("/api/v1/market-summary?market=m%201"),
			withStatsTimeZone("/api/v1/market-summary/players?market=m%201"),
			withStatsTimeZone("/api/v1/market-summary/insights?period=week&market=m+1"),
		]);
		expect(maxInFlight).toBe(1);
	});

	it("warms the panel's department filtered keys, players included", async () => {
		const order: string[] = [];
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url: string) => {
				order.push(url);
				return { ok: true, status: 200, json: async () => ({ data: {} }) };
			}),
		);
		const client = new QueryClient();

		await prefetchMarketSummary(client, null, "month", ["partnerships", "magic"]);

		expect(order).toEqual([
			withStatsTimeZone("/api/v1/market-summary?departments=magic%2Cpartnerships"),
			withStatsTimeZone("/api/v1/market-summary/players?departments=magic%2Cpartnerships"),
			withStatsTimeZone(
				"/api/v1/market-summary/insights?period=month&departments=magic%2Cpartnerships",
			),
		]);
	});
});
