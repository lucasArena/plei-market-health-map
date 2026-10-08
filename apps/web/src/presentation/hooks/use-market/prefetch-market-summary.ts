import { DEFAULT_STATS_PERIOD, type StatsPeriod } from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import type { QueryClient } from "@tanstack/react-query";
import { marketGameInsightsQueryOptions } from "@/presentation/hooks/use-market/use-market-game-insights";
import { marketPlayerStatsQueryOptions } from "@/presentation/hooks/use-market/use-market-player-stats";
import { marketSummaryQueryOptions } from "@/presentation/hooks/use-market/use-market-summary";

export async function prefetchMarketSummary(
	queryClient: QueryClient,
	marketId: string | null,
	period: StatsPeriod = DEFAULT_STATS_PERIOD,
	departments: readonly GameDepartment[] = [],
): Promise<void> {
	await queryClient.prefetchQuery(marketSummaryQueryOptions(marketId, true, departments));
	await queryClient.prefetchQuery(marketPlayerStatsQueryOptions(marketId, true, departments));
	await queryClient.prefetchQuery(
		marketGameInsightsQueryOptions(marketId, period, true, departments),
	);
}
