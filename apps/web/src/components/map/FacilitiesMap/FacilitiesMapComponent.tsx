"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useFacilitiesMapRules } from "@/components/map/FacilitiesMap/FacilitiesMapComponent.rules";
import { FacilityHoverCard } from "@/components/map/FacilityHoverCard/FacilityHoverCardComponent";

export function FacilitiesMap() {
	const { containerRef, hovered, messages, status } = useFacilitiesMapRules();
	const overlayMessage = { loading: messages.loading, error: messages.failed, ready: null }[status];

	return (
		<section aria-label={messages.title} className="absolute inset-0">
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
			{hovered && <FacilityHoverCard hover={hovered} messages={messages} />}
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
