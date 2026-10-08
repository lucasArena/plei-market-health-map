"use client";

import { MARKET_SUMMARY_TOGGLE_BASE_CLASS } from "@/presentation/components/layout/MarketSummaryToggle/MarketSummaryToggleComponent.styles";
import { useMetricDrillDownToggleRules } from "@/presentation/components/layout/MetricDrillDownToggle/MetricDrillDownToggleComponent.rules";
import { MetricDrillDownPanel } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent";

export function MetricDrillDownToggle() {
	const { isOpen, isClosing, handleClosed, isVisible, close, toggle, label, triggerRef } =
		useMetricDrillDownToggleRules();
	if (!isVisible) return null;
	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				title={label}
				aria-label={label}
				aria-expanded={isOpen}
				aria-controls="metric-drill-down-panel"
				aria-pressed={isOpen}
				onClick={toggle}
				className={MARKET_SUMMARY_TOGGLE_BASE_CLASS}
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
					<rect x="4" y="12" width="3" height="8" rx="1.5" />
					<rect x="10.5" y="4" width="3" height="16" rx="1.5" />
					<rect x="17" y="8" width="3" height="12" rx="1.5" />
				</svg>
			</button>
			<MetricDrillDownPanel
				isOpen={isOpen}
				isClosing={isClosing}
				onClosed={handleClosed}
				onClose={close}
				triggerRef={triggerRef}
			/>
		</>
	);
}
