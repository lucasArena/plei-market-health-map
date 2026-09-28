"use client";

import type { FacilityPointView } from "@market-health-map/application";
import type { GeoJSONSource, MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	CLUSTER_COUNT_LAYER_ID,
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_LAYER_ID,
	CLUSTER_MAX_ZOOM,
	CLUSTER_PAINT,
	CLUSTER_PREVIEW_LIMIT,
	CLUSTER_RADIUS,
	FACILITIES_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_PAINT,
	HOVER_CARD_WIDTH,
	MAP_CENTER,
	MAP_STYLE_URL,
	MAP_ZOOM,
	MAPLIBRE_WORKER_URL,
	PANEL_WIDTH,
	selectedStrokeColor,
	selectedStrokeWidth,
	UNCLUSTERED_FILTER,
} from "@/components/map/FacilitiesMap/FacilitiesMapComponent.styles";
import type {
	FacilitiesMapStatus,
	FacilityFeatureCollection,
	HoverPlacement,
	MapHover,
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

export function facilitiesForIds(
	ids: unknown[],
	facilitiesById: Map<string, FacilityPointView>,
): FacilityPointView[] {
	return ids.flatMap((id) => {
		const facility = typeof id === "string" ? facilitiesById.get(id) : undefined;
		return facility ? [facility] : [];
	});
}

export function placeHover(
	point: { x: number; y: number },
	size: { width: number; height: number },
): HoverPlacement {
	return {
		x: point.x,
		y: point.y,
		flipX: point.x + HOVER_CARD_WIDTH > size.width,
		flipY: point.y > size.height / 2,
	};
}

function clusterFromEvent(event: MapLayerMouseEvent) {
	const feature = event.features?.[0];
	const clusterId = feature?.properties?.cluster_id;
	if (!feature || typeof clusterId !== "number") return null;
	return {
		clusterId,
		total: Number(feature.properties.point_count),
		center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
	};
}

export function useFacilitiesMapRules() {
	const { messages } = useMessages();
	const query = useFacilities();
	const [isMapReady, setIsMapReady] = useState(false);
	const [hovered, setHovered] = useState<MapHover | null>(null);
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const hoveredClusterIdRef = useRef<number | null>(null);
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

	const placementFor = useCallback((point: { x: number; y: number }) => {
		const container = mapRef.current?.getContainer();
		return placeHover(point, {
			width: container?.clientWidth ?? Number.POSITIVE_INFINITY,
			height: container?.clientHeight ?? Number.POSITIVE_INFINITY,
		});
	}, []);

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
			hoveredClusterIdRef.current = null;
			setHovered(facility ? { kind: "facility", facility, ...placementFor(event.point) } : null);
		},
		[facilityFromEvent, placementFor],
	);

	const handleClusterHover = useCallback(
		(event: MapLayerMouseEvent) => {
			const cluster = clusterFromEvent(event);
			if (!cluster) return;
			const { clusterId, total } = cluster;
			const placement = placementFor(event.point);
			if (hoveredClusterIdRef.current === clusterId) {
				setHovered((current) => (current ? { ...current, ...placement } : current));
				return;
			}
			hoveredClusterIdRef.current = clusterId;
			setHovered({ kind: "cluster", clusterId, total, facilities: [], ...placement });
			const source = mapRef.current?.getSource<GeoJSONSource>(FACILITIES_SOURCE_ID);
			source
				?.getClusterLeaves(clusterId, CLUSTER_PREVIEW_LIMIT, 0)
				.then((leaves) => {
					const facilities = facilitiesForIds(
						leaves.map((leaf) => leaf.properties?.id),
						facilitiesById,
					);
					setHovered((current) =>
						current?.kind === "cluster" && current.clusterId === clusterId
							? { ...current, facilities }
							: current,
					);
				})
				.catch(() => undefined);
		},
		[facilitiesById, placementFor],
	);

	const handleHoverEnd = useCallback(() => {
		hoveredClusterIdRef.current = null;
		setHovered(null);
	}, []);

	const handleClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const facility = facilityFromEvent(event);
			if (!facility) return;
			handleHoverEnd();
			setSelectedFacilityId(facility.id);
			mapRef.current?.easeTo({
				center: [facility.location.longitude, facility.location.latitude],
				padding: { top: 0, bottom: 0, left: 0, right: PANEL_WIDTH },
				duration: 600,
			});
		},
		[facilityFromEvent, handleHoverEnd],
	);

	const handleClusterClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const cluster = clusterFromEvent(event);
			const map = mapRef.current;
			if (!cluster || !map) return;
			handleHoverEnd();
			map
				.getSource<GeoJSONSource>(FACILITIES_SOURCE_ID)
				?.getClusterExpansionZoom(cluster.clusterId)
				.then((zoom) => map.easeTo({ center: cluster.center, zoom, duration: 500 }))
				.catch(() => undefined);
		},
		[handleHoverEnd],
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
					cluster: true,
					clusterRadius: CLUSTER_RADIUS,
					clusterMaxZoom: CLUSTER_MAX_ZOOM,
				});
				map?.addLayer({
					id: CLUSTER_LAYER_ID,
					type: "circle",
					source: FACILITIES_SOURCE_ID,
					filter: CLUSTER_FILTER,
					paint: CLUSTER_PAINT,
				});
				map?.addLayer({
					id: CLUSTER_COUNT_LAYER_ID,
					type: "symbol",
					source: FACILITIES_SOURCE_ID,
					filter: CLUSTER_FILTER,
					layout: CLUSTER_COUNT_LAYOUT,
					paint: CLUSTER_COUNT_PAINT,
				});
				map?.addLayer({
					id: FACILITIES_LAYER_ID,
					type: "circle",
					source: FACILITIES_SOURCE_ID,
					filter: UNCLUSTERED_FILTER,
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
		const bindings = [
			["mouseenter", FACILITIES_LAYER_ID, showPointer],
			["mousemove", FACILITIES_LAYER_ID, handleHover],
			["mouseleave", FACILITIES_LAYER_ID, hidePointer],
			["click", FACILITIES_LAYER_ID, handleClick],
			["mouseenter", CLUSTER_LAYER_ID, showPointer],
			["mousemove", CLUSTER_LAYER_ID, handleClusterHover],
			["mouseleave", CLUSTER_LAYER_ID, hidePointer],
			["click", CLUSTER_LAYER_ID, handleClusterClick],
		] as const;
		for (const [event, layer, handler] of bindings) map.on(event, layer, handler);
		map.on("movestart", handleHoverEnd);
		return () => {
			for (const [event, layer, handler] of bindings) map.off(event, layer, handler);
			map.off("movestart", handleHoverEnd);
		};
	}, [
		handleClick,
		handleClusterClick,
		handleClusterHover,
		handleHover,
		handleHoverEnd,
		isMapReady,
	]);

	return {
		closePanel,
		containerRef,
		hovered,
		messages: messages.map,
		selectedFacility,
		status,
	};
}
