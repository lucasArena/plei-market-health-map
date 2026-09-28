"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useFacilitiesMapRules } from "@/components/map/FacilitiesMap/FacilitiesMapComponent.rules";
import { TOOLTIP_OFFSET } from "@/components/map/FacilitiesMap/FacilitiesMapComponent.styles";
import { FacilityAvatar } from "@/components/map/FacilityAvatar/FacilityAvatarComponent";
import { FacilityPanel } from "@/components/map/FacilityPanel/FacilityPanelComponent";

export function FacilitiesMap() {
	const { closePanel, containerRef, hovered, messages, selectedFacility, status } =
		useFacilitiesMapRules();
	const overlayMessage = { loading: messages.loading, error: messages.failed, ready: null }[status];

	return (
		<section
			aria-label={messages.title}
			data-panel-open={selectedFacility !== null}
			className="facilities-map absolute inset-0"
		>
			<div className="absolute inset-0">
				<div ref={containerRef} data-testid="facilities-map" className="h-full w-full" />
			</div>
			{overlayMessage && (
				<p
					role="status"
					className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground"
				>
					{overlayMessage}
				</p>
			)}
			{hovered && (
				<div
					role="tooltip"
					className="pointer-events-none absolute z-10 flex items-center gap-2 rounded-lg border bg-background/95 py-1.5 pr-3 pl-1.5 shadow-lg backdrop-blur"
					style={{ left: hovered.x + TOOLTIP_OFFSET, top: hovered.y + TOOLTIP_OFFSET }}
				>
					<FacilityAvatar name={hovered.facility.name} avatarUrl={hovered.facility.avatarUrl} />
					<span className="text-sm font-medium whitespace-nowrap">{hovered.facility.name}</span>
				</div>
			)}
			{selectedFacility && (
				<FacilityPanel key={selectedFacility.id} facility={selectedFacility} onClose={closePanel} />
			)}
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
