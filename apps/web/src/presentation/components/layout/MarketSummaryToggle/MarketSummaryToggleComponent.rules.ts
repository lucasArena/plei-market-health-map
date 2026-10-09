"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import type { MarketSummaryToggleState } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useSidePanels } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import { prefetchFacilityStats } from "@/presentation/hooks/use-facility/prefetch-facility-stats";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { prefetchMarketSummary } from "@/presentation/hooks/use-market/prefetch-market-summary";
import { useIdleMarketPrefetch } from "@/presentation/hooks/use-market/use-idle-market-prefetch";
import { useMarketSummaryFilters } from "@/presentation/hooks/use-market/use-market-summary-filters";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

export function nextToggleState(state: MarketSummaryToggleState): MarketSummaryToggleState {
	return ({ closed: "open", open: "closing", closing: "open" } as const)[state];
}

export function useMarketSummaryToggleRules() {
	const { messages } = useMessages();
	const isOnMap = usePathname() === "/";
	const [state, setState] = useState<MarketSummaryToggleState>("closed");
	const { activePanel, closePanel } = useSidePanels();
	const opensOnLoad = useFeatureFlag("insights-panel-v3");
	/** insights-panel-v3: facilities open inside the insight panel, never in the drawer. */
	const isInsightIteration = opensOnLoad;
	const isFacilitySelected = !isInsightIteration && activePanel === "facility-detail";
	const queryClient = useQueryClient();
	const { period, scope, selectedFacilityId } = useMapScope();
	const { departments } = useMarketSummaryFilters();
	const hasOpenedOnLoad = useRef(false);
	useIdleMarketPrefetch(isOnMap);

	const prefetchScope = useCallback(() => {
		if (scope.kind === "facility") {
			void prefetchFacilityStats(queryClient, scope.id).catch(() => undefined);
			return;
		}
		const marketId = scope.kind === "market" ? scope.id : null;
		void prefetchMarketSummary(queryClient, marketId, period, departments).catch(() => undefined);
	}, [departments, period, queryClient, scope]);

	const toggle = useCallback(() => {
		if (isFacilitySelected) {
			closePanel("facility-detail");
			return;
		}
		if (state !== "open") activityTracker.count("marketSummariesOpened");
		setState(nextToggleState);
	}, [closePanel, isFacilitySelected, state]);
	const close = useCallback(
		() => setState((current) => (current === "open" ? "closing" : current)),
		[],
	);
	const handleClosed = useCallback(() => setState("closed"), []);
	useExclusiveSidePanel("market-summary", state === "open", close);

	useEffect(() => {
		if (!isOnMap) setState("closed");
	}, [isOnMap]);

	useEffect(() => {
		if (activePanel === "market-summary" && state === "closed") setState("open");
	}, [activePanel, state]);

	// Picking a facility on the map, in search or in a panel row opens its level in the panel.
	useEffect(() => {
		if (isInsightIteration && selectedFacilityId && isOnMap) setState("open");
	}, [isInsightIteration, selectedFacilityId, isOnMap]);

	useEffect(() => {
		if (!opensOnLoad || !isOnMap || hasOpenedOnLoad.current) return;
		hasOpenedOnLoad.current = true;
		setState("open");
	}, [isOnMap, opensOnLoad]);

	return {
		prefetchScope,
		close,
		handleClosed,
		isActive: state === "open" || isFacilitySelected,
		isClosing: state === "closing",
		isMounted: state !== "closed",
		isOnMap,
		messages: messages.marketSummary,
		toggle,
	};
}
