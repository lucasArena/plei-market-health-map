"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { createPortal } from "react-dom";
import { FacilityDetailPanel } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent";
import { FacilityHoverCard } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent";
import { MapSearch } from "@/presentation/components/map/MapSearch/MapSearchComponent";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { useFacilitiesMapScreenRules } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules";
import {
	SESSION_HEATMAP_BUCKET_COLORS,
	SESSION_HEATMAP_LEGEND_CLASS,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

export function FacilitiesMapScreen() {
	const {
		clearSearchScope,
		closePanel,
		containerRef,
		facilities,
		finishLegendMotion,
		handlePanelClosed,
		hovered,
		isLegendShown,
		legendMotionClass,
		isPanelClosing,
		messages,
		selectedFacilityId,
		selectSearchFacility,
		selectSearchMarket,
		sessionScale,
		status,
	} = useFacilitiesMapScreenRules();
	const { searchSlot } = useHeaderSlot();
	const overlayMessage = { loading: messages.loading, error: messages.failed, ready: null }[status];
	const numberFormatter = new Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	});
	const lowValue = numberFormatter.format(sessionScale.low);
	const midValue = numberFormatter.format(Math.round((sessionScale.low + sessionScale.high) / 2));
	const highValue = numberFormatter.format(sessionScale.high);

	return (
		<section aria-label={messages.title} className="absolute inset-0">
			<div className="absolute inset-0">
				<div ref={containerRef} data-testid="facilities-map" className="map-frame h-full w-full" />
			</div>
			{searchSlot &&
				createPortal(
					<MapSearch
						facilities={facilities}
						messages={messages}
						onFacilitySelect={selectSearchFacility}
						onMarketSelect={selectSearchMarket}
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
			{hovered && <FacilityHoverCard hover={hovered} messages={messages} />}
			{isLegendShown && (
				<div
					data-testid="session-heatmap-legend"
					onAnimationEnd={finishLegendMotion}
					className={`${SESSION_HEATMAP_LEGEND_CLASS} ${legendMotionClass}`}
				>
					<p className="text-[11px] font-semibold tracking-tight text-foreground">
						{messages.sessionHeatmapLegend}
					</p>
					<p className="mt-0.5 text-[10px] text-muted-foreground">
						{messages.sessionHeatmapContext}
					</p>
					{sessionScale.high === 0 ? (
						<p className="mt-2 text-[10px] font-medium text-muted-foreground">
							{messages.sessionHeatmapNoActivity}
						</p>
					) : (
						<div className="mt-2 flex flex-col gap-1">
							<div
								data-testid="session-heatmap-gradient"
								className="h-2.5 w-full rounded-full"
								style={{
									backgroundImage: `linear-gradient(to right, ${SESSION_HEATMAP_BUCKET_COLORS.join(", ")})`,
								}}
							/>
							<div className="relative flex items-center justify-between">
								<span aria-hidden="true" className="text-[10px] tabular-nums text-muted-foreground">
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
				</div>
			)}
			{selectedFacilityId && (
				<FacilityDetailPanel
					facilityId={selectedFacilityId}
					isClosing={isPanelClosing}
					onClose={closePanel}
					onClosed={handlePanelClosed}
				/>
			)}
		</section>
	);
}
