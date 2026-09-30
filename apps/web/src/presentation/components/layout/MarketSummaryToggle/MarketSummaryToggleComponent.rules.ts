"use client";

import { useCallback, useState } from "react";
import type { MarketSummaryToggleState } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function nextToggleState(state: MarketSummaryToggleState): MarketSummaryToggleState {
	return ({ closed: "open", open: "closing", closing: "open" } as const)[state];
}

export function useMarketSummaryToggleRules() {
	const { messages } = useMessages();
	const [state, setState] = useState<MarketSummaryToggleState>("closed");

	const toggle = useCallback(() => setState(nextToggleState), []);
	const close = useCallback(
		() => setState((current) => (current === "open" ? "closing" : current)),
		[],
	);
	const handleClosed = useCallback(() => setState("closed"), []);

	return {
		close,
		handleClosed,
		isActive: state === "open",
		isClosing: state === "closing",
		isMounted: state !== "closed",
		messages: messages.marketSummary,
		toggle,
	};
}
