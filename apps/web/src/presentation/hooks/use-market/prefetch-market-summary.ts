import { DEFAULT_STATS_PERIOD, type StatsPeriod } from "@market-health-map/core/application";
import type { QueryClient } from "@tanstack/react-query";
import { marketGameInsightsQueryOptions } from "@/presentation/hooks/use-market/use-market-game-insights";
import { marketPlayerStatsQueryOptions } from "@/presentation/hooks/use-market/use-market-player-stats";
import { marketSummaryQueryOptions } from "@/presentation/hooks/use-market/use-market-summary";

export async function prefetchMarketSummary(
	queryClient: QueryClient,
	marketId: string | null,
	period: StatsPeriod = DEFAULT_STATS_PERIOD,
): Promise<void> {
	await queryClient.prefetchQuery(marketSummaryQueryOptions(marketId));
	await queryClient.prefetchQuery(marketPlayerStatsQueryOptions(marketId));
	await queryClient.prefetchQuery(marketGameInsightsQueryOptions(marketId, period));
}
