"use client";
import { useFacilitiesMapScreenRules } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules";

import "maplibre-gl/dist/maplibre-gl.css";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FacilityDetailPanel } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent";
import { FacilityHoverCard } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent";
import { MapSearch } from "@/presentation/components/map/MapSearch/MapSearchComponent";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import {
	SESSION_HEATMAP_BUCKET_COLORS,
	SESSION_HEATMAP_LEGEND_CLASS,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type { SessionLegendFiltersProps } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export function FacilitiesMapScreen() {
	const {
		canRemoveSessionFilters,
		clearSearchScope,
		closePanel,
		containerRef,
		facilities,
		sessionHeatmapLegend,
		finishLegendMotion,
		handlePanelClosed,
		holdClusterHover,
		hovered,
		isLegendShown,
		legendMotionClass,
		isPanelClosing,
		messages,
		releaseClusterHover,
		removeSessionFilter,
		selectedFacilityId,
		selectedTrend,
		selectFacility,
		selectSearchFacility,
		selectSearchMarket,
		selectSearchPlace,
		retrySessionHeatmap,
		sessionFilterChips,
		sessionQueryFailed,
		sessionQueryStatus,
		sessionScale,
		sessionLegendState,
		shownFacilities,
		status,
	} = useFacilitiesMapScreenRules();
	const { legendSlot, searchSlot } = useHeaderSlot();
	const overlayMessage = { loading: messages.loading, error: messages.failed, ready: null }[status];
	const numberFormatter = new Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	});
	const lowValue = numberFormatter.format(sessionScale.low);
	const midValue = numberFormatter.format(Math.round((sessionScale.low + sessionScale.high) / 2));
	const highValue = numberFormatter.format(sessionScale.high);
	const heatmapGradient = `linear-gradient(to right, ${SESSION_HEATMAP_BUCKET_COLORS.join(", ")})`;

	return (
		<section aria-label={messages.title} className="absolute inset-0">
			<div className="absolute inset-0">
				<div ref={containerRef} data-testid="facilities-map" className="map-frame h-full w-full" />
			</div>
			{searchSlot &&
				createPortal(
					<MapSearch
						facilities={facilities}
						shownFacilities={shownFacilities}
						messages={messages}
						onFacilitySelect={selectSearchFacility}
						onMarketSelect={selectSearchMarket}
						onPlaceSelect={selectSearchPlace}
						onClear={clearSearchScope}
					/>,
					searchSlot,
				)}
			{overlayMessage && (
				<p
					role="status"
					className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground"
				>
					{overlayMessage}
				</p>
			)}
			<FacilityHoverCard
				hover={hovered}
				messages={messages}
				onClusterPointerEnter={holdClusterHover}
				onClusterPointerLeave={releaseClusterHover}
				onFacilitySelect={selectFacility}
			/>
			{isLegendShown &&
				legendSlot &&
				createPortal(
					<div
						data-testid="session-heatmap-legend"
						onAnimationEnd={finishLegendMotion}
						className={`${SESSION_HEATMAP_LEGEND_CLASS} ${legendMotionClass}`}
					>
						<p className="text-[11px] font-semibold tracking-tight text-foreground">
							{sessionHeatmapLegend}
						</p>
						<SessionLegendFilters
							chips={sessionFilterChips}
							context={messages.sessionHeatmapContext}
							expandLabel={messages.sessionFilters.expandFilters}
							collapseLabel={messages.sessionFilters.collapseFilters}
							removeLabel={messages.sessionFilters.remove}
							canRemove={canRemoveSessionFilters}
							onRemove={removeSessionFilter}
						/>
						{sessionLegendState === "loading" && (
							<div role="status" className="mt-2 flex flex-col gap-1">
								<div
									data-testid="session-heatmap-loading"
									aria-hidden="true"
									className="h-2.5 w-full rounded-full opacity-40 motion-safe:animate-pulse"
									style={{ backgroundImage: heatmapGradient }}
								/>
								<span className="text-[10px] font-medium text-muted-foreground">
									{messages.sessionHeatmapLoading}
								</span>
							</div>
						)}
						{sessionLegendState === "empty" && (
							<div className="mt-2">
								<p role="status" className="text-[10px] font-medium text-muted-foreground">
									{sessionFilterChips.length > 0 && sessionQueryStatus
										? sessionQueryStatus
										: messages.sessionHeatmapNoActivity}
								</p>
								{sessionQueryFailed && sessionFilterChips.length > 0 && (
									<button
										type="button"
										onClick={retrySessionHeatmap}
										className="mt-1 cursor-pointer text-[10px] text-foreground underline"
									>
										{messages.sessionFilters.retry}
									</button>
								)}
							</div>
						)}
						{sessionLegendState === "scale" && (
							<div className="mt-2 flex flex-col gap-1">
								<div
									data-testid="session-heatmap-gradient"
									className="h-2.5 w-full rounded-full"
									style={{ backgroundImage: heatmapGradient }}
								/>
								<div className="relative flex items-center justify-between">
									<span
										aria-hidden="true"
										className="text-[10px] tabular-nums text-muted-foreground"
									>
										{lowValue}
									</span>
									<span className="sr-only">
										{messages.sessionHeatmapLowValue.replace("{count}", lowValue)}
									</span>
									<span
										aria-hidden="true"
										className="absolute left-1/2 -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground"
									>
										{midValue}
									</span>
									<span className="sr-only">
										{messages.sessionHeatmapMidValue.replace("{count}", midValue)}
									</span>
									<span
										aria-hidden="true"
										className="text-[10px] font-medium tabular-nums text-pleiful-moonlight-70"
									>
										{highValue}+
									</span>
									<span className="sr-only">
										{messages.sessionHeatmapHighValue.replace("{count}", highValue)}
									</span>
								</div>
							</div>
						)}
					</div>,
					legendSlot,
				)}
			{selectedFacilityId && (
				<FacilityDetailPanel
					facilityId={selectedFacilityId}
					isClosing={isPanelClosing}
					onClose={closePanel}
					onClosed={handlePanelClosed}
					trend={selectedTrend}
				/>
			)}
		</section>
	);
}

function SessionLegendFilters({
	chips,
	context,
	expandLabel,
	collapseLabel,
	removeLabel,
	canRemove,
	onRemove,
}: Readonly<SessionLegendFiltersProps>) {
	const safeChips = chips ?? [];
	const [expanded, setExpanded] = useState(false);
	const [overflows, setOverflows] = useState(false);
	const rowRef = useRef<HTMLDivElement>(null);
	const chipKey = safeChips.map((chip) => `${chip.field}:${chip.id}`).join("|");

	useLayoutEffect(() => {
		void chipKey;
		setExpanded(false);
	}, [chipKey]);

	useLayoutEffect(() => {
		const node = rowRef.current;
		if (!node || expanded || safeChips.length === 0) {
			setOverflows(false);
			return;
		}
		const measure = () => {
			void chipKey;
			setOverflows(node.scrollWidth > node.clientWidth + 1);
		};
		measure();
		const frame = requestAnimationFrame(measure);
		if (typeof ResizeObserver === "undefined") {
			return () => cancelAnimationFrame(frame);
		}
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [chipKey, safeChips.length, expanded]);

	if (safeChips.length === 0) {
		return <p className="mt-0.5 text-[10px] text-muted-foreground">{context}</p>;
	}

	const showToggle = overflows || expanded;

	return (
		<div className="mt-0.5 flex items-start gap-1">
			<div
				ref={rowRef}
				data-testid="session-legend-filters"
				className={
					expanded
						? "flex min-w-0 flex-1 flex-wrap gap-1"
						: "flex min-w-0 flex-1 flex-nowrap gap-1 overflow-hidden"
				}
			>
				{safeChips.map((chip) => (
					<span
						key={`${chip.field}-${chip.id}`}
						className="group relative inline-flex max-w-full shrink-0 items-center rounded-full border border-border bg-foreground/[0.03] py-0.5 pr-1.5 pl-1.5 text-[10px] text-muted-foreground transition-[padding] hover:pr-4"
					>
						<span className="truncate">{chip.label}</span>
						<button
							type="button"
							disabled={!canRemove}
							aria-label={removeLabel.replace("{filter}", chip.label)}
							onClick={() => onRemove(chip.field, chip.id)}
							className="absolute top-1/2 right-0.5 flex size-3.5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/90 text-[11px] leading-none text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-default disabled:opacity-0"
						>
							<span aria-hidden="true">×</span>
						</button>
					</span>
				))}
			</div>
			{showToggle && (
				<button
					type="button"
					aria-expanded={expanded}
					aria-label={expanded ? collapseLabel : expandLabel}
					onClick={() => setExpanded((current) => !current)}
					className="mt-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`}
					>
						<path d="m4 6 4 4 4-4" />
					</svg>
				</button>
			)}
		</div>
	);
}
