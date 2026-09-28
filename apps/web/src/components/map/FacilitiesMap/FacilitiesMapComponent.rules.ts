"use client";

import type { FacilityPointView } from "@market-health-map/application";
import type { GeoJSONSource, MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	FACILITIES_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_PAINT,
	MAP_CENTER,
	MAP_STYLE_URL,
	MAP_ZOOM,
	MAPLIBRE_WORKER_URL,
	PANEL_WIDTH,
	selectedStrokeColor,
	selectedStrokeWidth,
} from "@/components/map/FacilitiesMap/FacilitiesMapComponent.styles";
import type {
	FacilitiesMapStatus,
	FacilityFeatureCollection,
	HoveredFacility,
} from "@/components/map/FacilitiesMap/FacilitiesMapComponent.types";
import { useFacilities } from "@/lib/api/use-facilities";

export function toFacilityFeatureCollection(
	facilities: FacilityPointView[],
): FacilityFeatureCollection {
	return {
		type: "FeatureCollection",
		features: facilities.map((facility) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [facility.location.longitude, facility.location.latitude],
			},
			properties: { id: facility.id, marketId: facility.marketId, name: facility.name },
		})),
	};
}

export function resolveMapStatus(isPending: boolean, isError: boolean): FacilitiesMapStatus {
	const status = { [`${!isPending}`]: "ready", [`${isError}`]: "error" }.true;
	return (status ?? "loading") as FacilitiesMapStatus;
}

export function useFacilitiesMapRules() {
	const { messages } = useMessages();
	const query = useFacilities();
	const [isMapReady, setIsMapReady] = useState(false);
	const [hovered, setHovered] = useState<HoveredFacility | null>(null);
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const featureCollection = useMemo(
		() => toFacilityFeatureCollection(query.data ?? []),
		[query.data],
	);
	const facilitiesById = useMemo(
		() => new Map((query.data ?? []).map((facility) => [facility.id, facility])),
		[query.data],
	);
	const status = resolveMapStatus(query.isPending, query.isError);
	const selectedFacility = selectedFacilityId
		? (facilitiesById.get(selectedFacilityId) ?? null)
		: null;

	const facilityFromEvent = useCallback(
		(event: MapLayerMouseEvent) => {
			const id = event.features?.[0]?.properties?.id;
			return typeof id === "string" ? (facilitiesById.get(id) ?? null) : null;
		},
		[facilitiesById],
	);

	const handleHover = useCallback(
		(event: MapLayerMouseEvent) => {
			const facility = facilityFromEvent(event);
			setHovered(facility ? { facility, x: event.point.x, y: event.point.y } : null);
		},
		[facilityFromEvent],
	);

	const handleHoverEnd = useCallback(() => setHovered(null), []);

	const handleClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const facility = facilityFromEvent(event);
			if (!facility) return;
			setHovered(null);
			setSelectedFacilityId(facility.id);
			mapRef.current?.easeTo({
				center: [facility.location.longitude, facility.location.latitude],
				padding: { top: 0, bottom: 0, left: 0, right: PANEL_WIDTH },
				duration: 600,
			});
		},
		[facilityFromEvent],
	);

	const closePanel = useCallback(() => {
		setSelectedFacilityId(null);
		mapRef.current?.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let isCancelled = false;
		let map: MapLibreMap | null = null;

		import("maplibre-gl").then(({ Map: MapLibre, NavigationControl, setWorkerUrl }) => {
			if (isCancelled) return;
			setWorkerUrl(new URL(MAPLIBRE_WORKER_URL, window.location.origin).href);
			map = new MapLibre({
				container,
				style: MAP_STYLE_URL,
				center: MAP_CENTER,
				zoom: MAP_ZOOM,
				attributionControl: false,
			});
			map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
			map.on("load", () => {
				map?.addSource(FACILITIES_SOURCE_ID, {
					type: "geojson",
					data: { type: "FeatureCollection", features: [] },
				});
				map?.addLayer({
					id: FACILITIES_LAYER_ID,
					type: "circle",
					source: FACILITIES_SOURCE_ID,
					paint: FACILITY_DOT_PAINT,
				});
				mapRef.current = map;
				setIsMapReady(true);
			});
		});

		return () => {
			isCancelled = true;
			mapRef.current = null;
			map?.remove();
		};
	}, []);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		map.getSource<GeoJSONSource>(FACILITIES_SOURCE_ID)?.setData(featureCollection);
	}, [featureCollection, isMapReady]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		map.setPaintProperty(
			FACILITIES_LAYER_ID,
			"circle-stroke-color",
			selectedStrokeColor(selectedFacilityId),
		);
		map.setPaintProperty(
			FACILITIES_LAYER_ID,
			"circle-stroke-width",
			selectedStrokeWidth(selectedFacilityId),
		);
	}, [selectedFacilityId, isMapReady]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		const showPointer = () => {
			map.getCanvas().style.cursor = "pointer";
		};
		const hidePointer = () => {
			map.getCanvas().style.cursor = "";
			handleHoverEnd();
		};
		map.on("mouseenter", FACILITIES_LAYER_ID, showPointer);
		map.on("mousemove", FACILITIES_LAYER_ID, handleHover);
		map.on("mouseleave", FACILITIES_LAYER_ID, hidePointer);
		map.on("click", FACILITIES_LAYER_ID, handleClick);
		map.on("movestart", handleHoverEnd);
		return () => {
			map.off("mouseenter", FACILITIES_LAYER_ID, showPointer);
			map.off("mousemove", FACILITIES_LAYER_ID, handleHover);
			map.off("mouseleave", FACILITIES_LAYER_ID, hidePointer);
			map.off("click", FACILITIES_LAYER_ID, handleClick);
			map.off("movestart", handleHoverEnd);
		};
	}, [handleClick, handleHover, handleHoverEnd, isMapReady]);

	return {
		closePanel,
		containerRef,
		hovered,
		messages: messages.map,
		selectedFacility,
		status,
	};
}
