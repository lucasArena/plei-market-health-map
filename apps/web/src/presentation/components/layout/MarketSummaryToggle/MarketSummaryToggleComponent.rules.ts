"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import type { MarketSummaryToggleState } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useSidePanels } from "@/presentation/components/providers/SidePanelProvider/SidePanelProviderComponent";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";

export function nextToggleState(state: MarketSummaryToggleState): MarketSummaryToggleState {
	return ({ closed: "open", open: "closing", closing: "open" } as const)[state];
}

export function useMarketSummaryToggleRules() {
	const { messages } = useMessages();
	const isOnMap = usePathname() === "/";
	const [state, setState] = useState<MarketSummaryToggleState>("closed");
	const { activePanel, closePanel } = useSidePanels();
	const isFacilitySelected = activePanel === "facility-detail";

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

	return {
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
