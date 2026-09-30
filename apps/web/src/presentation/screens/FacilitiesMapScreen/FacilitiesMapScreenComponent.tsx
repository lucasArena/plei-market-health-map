"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { createPortal } from "react-dom";
import { Feedback } from "@/presentation/components/feedbacks/Feedback/FeedbackComponent";
import { FacilityDetailPanel } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent";
import { FacilityHoverCard } from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent";
import { MapSearch } from "@/presentation/components/map/MapSearch/MapSearchComponent";
import { useHeaderSlot } from "@/presentation/components/providers/HeaderSlotProvider/HeaderSlotProviderComponent";
import { useFacilitiesMapScreenRules } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.rules";
import { SESSION_HEATMAP_BUCKET_COLORS } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";

export function FacilitiesMapScreen() {
	const {
		clearSearchScope,
		closePanel,
		containerRef,
		facilities,
		handlePanelClosed,
		hasSessionHeatmap,
		hovered,
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
	const highValue = numberFormatter.format(sessionScale.high);

	return (
		<section aria-label={messages.title} className="absolute inset-0">
			<div className="absolute inset-0">
				<div ref={containerRef} data-testid="facilities-map" className="h-full w-full" />
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
			{hasSessionHeatmap && (
				<div
					data-testid="session-heatmap-legend"
					className="absolute bottom-8 left-16 min-w-56 rounded-xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-md"
				>
					<p className="text-[11px] font-semibold tracking-tight text-foreground">
						{messages.sessionHeatmapLegend}
					</p>
					<p className="mt-0.5 text-[9px] text-muted-foreground">
						{messages.sessionHeatmapContext}
					</p>
					{sessionScale.high === 0 ? (
						<p className="mt-2 text-[10px] font-medium text-muted-foreground">
							{messages.sessionHeatmapNoActivity}
						</p>
					) : (
						<div className="mt-2 flex items-center justify-between gap-3">
							<span
								aria-hidden="true"
								className="min-w-7 text-[10px] tabular-nums text-muted-foreground"
							>
								{lowValue}
							</span>
							<span className="sr-only">
								{messages.sessionHeatmapLowValue.replace("{count}", lowValue)}
							</span>
							<div
								data-testid="session-heatmap-gradient"
								className="h-2.5 flex-1 rounded-full"
								style={{
									backgroundImage: `linear-gradient(to right, ${SESSION_HEATMAP_BUCKET_COLORS.join(", ")})`,
								}}
							/>
							<span
								aria-hidden="true"
								className="min-w-7 text-right text-[10px] font-medium tabular-nums text-pleiful-moonlight-70"
							>
								{highValue}+
							</span>
							<span className="sr-only">
								{messages.sessionHeatmapHighValue.replace("{count}", highValue)}
							</span>
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
			<Feedback facilityId={selectedFacilityId} />
			<p className="absolute bottom-2 left-3 text-[10px] text-muted-foreground">
				<a
					href="https://openfreemap.org"
					target="_blank"
					rel="noreferrer"
					className="hover:underline"
				>
					OpenFreeMap
				</a>{" "}
				©{" "}
				<a
					href="https://www.openmaptiles.org/"
					target="_blank"
					rel="noreferrer"
					className="hover:underline"
				>
					OpenMapTiles
				</a>{" "}
				· ©{" "}
				<a
					href="https://www.openstreetmap.org/copyright"
					target="_blank"
					rel="noreferrer"
					className="hover:underline"
				>
					OpenStreetMap contributors
				</a>
			</p>
		</section>
	);
}
