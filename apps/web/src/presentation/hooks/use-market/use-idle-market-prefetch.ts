"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { canPrefetchInBackground, whenIdle } from "@/infrastructure/prefetch/prefetch-policy";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";
import { prefetchMarketSummary } from "@/presentation/hooks/use-market/prefetch-market-summary";

export function useIdleMarketPrefetch(isEnabled: boolean) {
	const queryClient = useQueryClient();
	const facilities = useFacilityListAll();
	const isMapLoaded = facilities.isSuccess;

	const prefetchAllMarkets = useCallback(() => {
		void prefetchMarketSummary(queryClient, null).catch(() => undefined);
	}, [queryClient]);

	useEffect(() => {
		if (!isEnabled || !isMapLoaded || !canPrefetchInBackground()) return;
		return whenIdle(prefetchAllMarkets);
	}, [isEnabled, isMapLoaded, prefetchAllMarkets]);

	return { prefetchAllMarkets };
}
