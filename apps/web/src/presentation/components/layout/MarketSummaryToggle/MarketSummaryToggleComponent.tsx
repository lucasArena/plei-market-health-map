"use client";

import { useMarketSummaryToggleRules } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.rules";
import {
	MARKET_SUMMARY_TOGGLE_BASE_CLASS,
	MARKET_SUMMARY_TOGGLE_CLASS,
} from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.styles";
import { MarketSummaryPanel } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent";

export function MarketSummaryToggle() {
	const { close, handleClosed, isActive, isClosing, isMounted, isOnMap, messages, toggle } =
		useMarketSummaryToggleRules();

	if (!isOnMap) return null;

	return (
		<>
			<button
				type="button"
				onClick={toggle}
				aria-label={messages.open}
				title={messages.open}
				aria-expanded={isActive}
				aria-pressed={isActive}
				className={`${MARKET_SUMMARY_TOGGLE_BASE_CLASS} ${MARKET_SUMMARY_TOGGLE_CLASS[isActive ? "active" : "idle"]}`}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className="size-5"
				>
					<rect width="18" height="18" x="3" y="3" rx="2" />
					<path d="M15 3v18" />
				</svg>
			</button>
			{isMounted && (
				<MarketSummaryPanel isClosing={isClosing} onClose={close} onClosed={handleClosed} />
			)}
		</>
	);
}
