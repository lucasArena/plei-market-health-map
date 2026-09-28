"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { MarketDetailPanel } from "@/components/markets/MarketDetailPanel/MarketDetailPanelComponent";
import { useMarketHealthMapRules } from "@/components/markets/MarketHealthMap/MarketHealthMapComponent.rules";

export function MarketHealthMap() {
	const {
		closeDetail,
		containerRef,
		legend,
		messages,
		metric,
		metricOptions,
		selectedMarketId,
		setMetric,
		status,
	} = useMarketHealthMapRules();
	const overlayMessage = { loading: messages.loading, error: messages.failed, ready: null }[status];

	return (
		<section
			aria-label={messages.title}
			data-panel-open={selectedMarketId !== null}
			className="market-health-map absolute inset-0"
		>
			<div className="absolute inset-0">
				<div ref={containerRef} data-testid="market-map" className="h-full w-full" />
			</div>
			{overlayMessage && (
				<p
					role="status"
					className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground"
				>
					{overlayMessage}
				</p>
			)}
			<fieldset className="absolute top-4 left-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
				<legend className="sr-only">{messages.metricLabel}</legend>
				{metricOptions.map((option) => (
					<button
						key={option.key}
						type="button"
						aria-pressed={metric === option.key}
						onClick={() => setMetric(option.key)}
						className="rounded-full border bg-background/95 px-3 py-1.5 text-sm shadow-md backdrop-blur transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
					>
						{option.label}
					</button>
				))}
			</fieldset>
			<div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] space-y-1.5 rounded-lg border bg-background/95 px-3 py-2 shadow-md backdrop-blur">
				<ul aria-label={messages.legendLabel} className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
					{legend.map((item) => (
						<li key={item.status} className="flex items-center gap-1.5">
							<span
								className="size-2.5 rounded-full"
								style={{ backgroundColor: item.color }}
								aria-hidden
							/>
							{item.label}
						</li>
					))}
				</ul>
				<p className="text-[11px] text-muted-foreground">{messages.sampleNotice}</p>
			</div>
			{selectedMarketId && (
				<MarketDetailPanel
					key={selectedMarketId}
					marketId={selectedMarketId}
					onClose={closeDetail}
				/>
			)}
		</section>
	);
}
