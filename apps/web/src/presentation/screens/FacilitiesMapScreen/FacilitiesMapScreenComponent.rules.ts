"use client";

import type { FacilityPointView } from "@market-health-map/core/application";
import { useQueryClient } from "@tanstack/react-query";
import type { GeoJSONSource, MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	type AppSessionHeatmapCellView,
	useAppSessionHeatmap,
} from "@/presentation/hooks/use-app/use-app-session-heatmap";
import { prefetchFacilityReservationStats } from "@/presentation/hooks/use-facility/prefetch-facility-reservation-stats";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";
import { usePleiLogoImages } from "@/presentation/hooks/use-map/use-plei-logo-images";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_PAINT,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_COUNT_LAYER_ID,
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_LAYER_ID,
	CLUSTER_MAX_ZOOM,
	CLUSTER_PAINT,
	CLUSTER_PREVIEW_LIMIT,
	CLUSTER_RADIUS,
	DETAIL_PANEL_OFFSET,
	FACILITIES_LAYER_ID,
	FACILITIES_LOGO_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_LAYOUT,
	FACILITY_DOT_PAINT,
	FACILITY_LOGO_LAYOUT,
	HOVER_CARD_WIDTH,
	MAP_CENTER,
	MAP_STYLE_URL,
	MAP_ZOOM,
	MAPLIBRE_WORKER_URL,
	selectedRingColor,
	selectedRingWidth,
	UNCLUSTERED_FILTER,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type {
	AppSessionHeatmapFeatureCollection,
	FacilitiesMapStatus,
	FacilityFeatureCollection,
	HoverPlacement,
	MapHover,
	SessionHeatmapArea,
	SessionHeatmapBounds,
	SessionHeatmapScale,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

function byActiveLast(a: FacilityPointView, b: FacilityPointView): number {
	return Number(a.isActive) - Number(b.isActive);
}

export function toFacilityFeatureCollection(
	facilities: FacilityPointView[],
): FacilityFeatureCollection {
	return {
		type: "FeatureCollection",
		features: [...facilities].sort(byActiveLast).map((facility) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [facility.location.longitude, facility.location.latitude],
			},
			properties: {
				id: facility.id,
				marketId: facility.marketId,
				name: facility.name,
				isActive: facility.isActive,
			},
		})),
	};
}

export function toAppSessionHeatmapFeatureCollection(
	cells: AppSessionHeatmapCellView[],
	bounds?: SessionHeatmapBounds,
): AppSessionHeatmapFeatureCollection {
	const visibleCells = bounds
		? cells.filter((cell) => bounds.contains([cell.lng, cell.lat]))
		: cells;
	const sortedWeights = visibleCells
		.map((cell) => cell.sessionWeight)
		.filter((weight) => weight > 0)
		.sort((a, b) => a - b);
	const localCeiling = sortedWeights[Math.ceil((sortedWeights.length - 1) * 0.9)] ?? 1;
	return {
		type: "FeatureCollection",
		features: visibleCells.map((cell) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [cell.lng, cell.lat],
			},
			properties: {
				sessionWeight: cell.sessionWeight,
				intensity: Math.min(1, Math.max(0.01, (cell.sessionWeight / localCeiling) ** 0.8)),
			},
		})),
	};
}

export function appSessionHeatmapAreas(
	cells: AppSessionHeatmapCellView[],
	bounds?: SessionHeatmapBounds,
): SessionHeatmapArea[] {
	const visibleCells = bounds
		? cells.filter((cell) => bounds.contains([cell.lng, cell.lat]))
		: cells;
	const west = bounds?.getWest?.();
	const east = bounds?.getEast?.();
	const south = bounds?.getSouth?.();
	const north = bounds?.getNorth?.();
	if (
		west === undefined ||
		east === undefined ||
		south === undefined ||
		north === undefined ||
		east <= west ||
		north <= south
	) {
		return visibleCells;
	}
	const areas = new Map<string, SessionHeatmapArea>();
	for (const cell of visibleCells) {
		const column = Math.min(23, Math.floor(((cell.lng - west) / (east - west)) * 24));
		const row = Math.min(15, Math.floor(((cell.lat - south) / (north - south)) * 16));
		const key = `${column}:${row}`;
		const current = areas.get(key);
		if (!current) {
			areas.set(key, { ...cell });
			continue;
		}
		const sessionWeight = current.sessionWeight + cell.sessionWeight;
		areas.set(key, {
			lat: (current.lat * current.sessionWeight + cell.lat * cell.sessionWeight) / sessionWeight,
			lng: (current.lng * current.sessionWeight + cell.lng * cell.sessionWeight) / sessionWeight,
			sessionWeight,
		});
	}
	return [...areas.values()];
}

export function appSessionHeatmapScale(
	cells: AppSessionHeatmapCellView[],
	bounds?: SessionHeatmapBounds,
): SessionHeatmapScale {
	const sortedWeights = appSessionHeatmapAreas(cells, bounds)
		.map((cell) => cell.sessionWeight)
		.filter((weight) => weight > 0)
		.sort((a, b) => a - b);
	if (sortedWeights.length === 0) return { low: 0, high: 0 };
	const lastIndex = sortedWeights.length - 1;
	return {
		low: sortedWeights[Math.floor(lastIndex * 0.1)] ?? 0,
		high: sortedWeights[Math.ceil(lastIndex * 0.9)] ?? 0,
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

const EMPTY_HEATMAP: AppSessionHeatmapFeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

const FACILITY_MAP_LAYER_IDS = [
	CLUSTER_LAYER_ID,
	CLUSTER_COUNT_LAYER_ID,
	FACILITIES_LAYER_ID,
	FACILITIES_LOGO_LAYER_ID,
] as const;

function applyMapLayerVisibility(map: MapLibreMap, layerId: string, visible: boolean) {
	if (typeof map.getLayer !== "function" || !map.getLayer(layerId)) return;
	map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

export function useFacilitiesMapScreenRules() {
	const { messages } = useMessages();
	const queryClient = useQueryClient();
	const query = useFacilityListAll();
	const heatmapQuery = useAppSessionHeatmap();
	const [isMapReady, setIsMapReady] = useState(false);
	const [hovered, setHovered] = useState<MapHover | null>(null);
	const [sessionScale, setSessionScale] = useState<SessionHeatmapScale>({ low: 0, high: 0 });
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
	const [isPanelClosing, setIsPanelClosing] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const mapLayers = useMapLayers();
	const showFacilities = mapLayers?.showFacilities ?? true;
	const showFacilitiesRef = useRef(showFacilities);
	showFacilitiesRef.current = showFacilities;
	const hoveredClusterIdRef = useRef<number | null>(null);
	const featureCollection = useMemo(
		() => toFacilityFeatureCollection(query.data ?? []),
		[query.data],
	);
	const heatmapFeatureCollection = useMemo(
		() =>
			heatmapQuery.isError || !heatmapQuery.data
				? EMPTY_HEATMAP
				: toAppSessionHeatmapFeatureCollection(heatmapQuery.data),
		[heatmapQuery.data, heatmapQuery.isError],
	);
	const facilitiesById = useMemo(
		() => new Map((query.data ?? []).map((facility) => [facility.id, facility])),
		[query.data],
	);
	const status = resolveMapStatus(query.isPending, query.isError);

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
			if (facility) void prefetchFacilityReservationStats(queryClient, facility.id);
		},
		[facilityFromEvent, placementFor, queryClient],
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

	const handleFacilityClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const facility = facilityFromEvent(event);
			if (!facility) return;
			handleHoverEnd();
			setIsPanelClosing(false);
			setSelectedFacilityId(facility.id);
			mapRef.current?.easeTo({
				center: [facility.location.longitude, facility.location.latitude],
				padding: { top: 0, bottom: 0, left: 0, right: DETAIL_PANEL_OFFSET },
				duration: 600,
			});
		},
		[facilityFromEvent, handleHoverEnd],
	);

	const closePanel = useCallback(() => {
		setIsPanelClosing(true);
		mapRef.current?.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
	}, []);

	const handlePanelClosed = useCallback(() => {
		setSelectedFacilityId(null);
		setIsPanelClosing(false);
	}, []);

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

	const refreshHeatmap = useCallback(() => {
		const map = mapRef.current;
		if (!map || heatmapQuery.isError || !heatmapQuery.data) return;
		const bounds = map.getBounds();
		map
			.getSource<GeoJSONSource>(APP_SESSION_HEATMAP_SOURCE_ID)
			?.setData(toAppSessionHeatmapFeatureCollection(heatmapQuery.data, bounds));
		const nextScale = appSessionHeatmapScale(heatmapQuery.data, bounds);
		setSessionScale((current) =>
			current.low === nextScale.low && current.high === nextScale.high ? current : nextScale,
		);
	}, [heatmapQuery.data, heatmapQuery.isError]);

	const areLogosLoaded = usePleiLogoImages(isMapReady ? mapRef.current : null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let isCancelled = false;
		let map: MapLibreMap | null = null;

		import("maplibre-gl").then(({ Map: MapLibre, NavigationControl, setWorkerUrl }) => {
			if (isCancelled) return;
			setWorkerUrl(new URL(MAPLIBRE_WORKER_URL, window.location.origin).href);
			const created = new MapLibre({
				container,
				style: MAP_STYLE_URL,
				center: MAP_CENTER,
				zoom: MAP_ZOOM,
				attributionControl: false,
			});
			map = created;
			created.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
			created.on("load", () => {
				created.addSource(APP_SESSION_HEATMAP_SOURCE_ID, {
					type: "geojson",
					data: EMPTY_HEATMAP,
				});
				created.addLayer({
					id: APP_SESSION_HEATMAP_LAYER_ID,
					type: "heatmap",
					source: APP_SESSION_HEATMAP_SOURCE_ID,
					paint: APP_SESSION_HEATMAP_PAINT,
				});
				created.addSource(FACILITIES_SOURCE_ID, {
					type: "geojson",
					data: { type: "FeatureCollection", features: [] },
					cluster: true,
					clusterRadius: CLUSTER_RADIUS,
					clusterMaxZoom: CLUSTER_MAX_ZOOM,
				});
				created.addLayer({
					id: CLUSTER_LAYER_ID,
					type: "circle",
					source: FACILITIES_SOURCE_ID,
					filter: CLUSTER_FILTER,
					paint: CLUSTER_PAINT,
				});
				created.addLayer({
					id: CLUSTER_COUNT_LAYER_ID,
					type: "symbol",
					source: FACILITIES_SOURCE_ID,
					filter: CLUSTER_FILTER,
					layout: CLUSTER_COUNT_LAYOUT,
					paint: CLUSTER_COUNT_PAINT,
				});
				created.addLayer({
					id: FACILITIES_LAYER_ID,
					type: "circle",
					source: FACILITIES_SOURCE_ID,
					filter: UNCLUSTERED_FILTER,
					layout: FACILITY_DOT_LAYOUT,
					paint: FACILITY_DOT_PAINT,
				});
				mapRef.current = created;
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
		if (heatmapQuery.isError || !heatmapQuery.data) {
			map.getSource<GeoJSONSource>(APP_SESSION_HEATMAP_SOURCE_ID)?.setData(EMPTY_HEATMAP);
			return;
		}
		refreshHeatmap();
	}, [heatmapQuery.data, heatmapQuery.isError, isMapReady, refreshHeatmap]);

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
			["click", FACILITIES_LAYER_ID, handleFacilityClick],
			["mouseenter", CLUSTER_LAYER_ID, showPointer],
			["mousemove", CLUSTER_LAYER_ID, handleClusterHover],
			["mouseleave", CLUSTER_LAYER_ID, hidePointer],
			["click", CLUSTER_LAYER_ID, handleClusterClick],
		] as const;
		for (const [event, layer, handler] of bindings) map.on(event, layer, handler);
		map.on("movestart", handleHoverEnd);
		map.on("moveend", refreshHeatmap);
		return () => {
			for (const [event, layer, handler] of bindings) map.off(event, layer, handler);
			map.off("movestart", handleHoverEnd);
			map.off("moveend", refreshHeatmap);
		};
	}, [
		handleClusterClick,
		handleClusterHover,
		handleFacilityClick,
		handleHover,
		handleHoverEnd,
		isMapReady,
		refreshHeatmap,
	]);

	const hasSessionHeatmap = heatmapFeatureCollection.features.length > 0;

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		const highlighted = isPanelClosing ? null : selectedFacilityId;
		map.setPaintProperty(
			FACILITIES_LAYER_ID,
			"circle-stroke-color",
			selectedRingColor(highlighted),
		);
		map.setPaintProperty(
			FACILITIES_LAYER_ID,
			"circle-stroke-width",
			selectedRingWidth(highlighted),
		);
	}, [selectedFacilityId, isPanelClosing, isMapReady]);

	useEffect(() => {
		const map = mapRef.current;
		if (!areLogosLoaded || !map) return;
		map.addLayer({
			id: FACILITIES_LOGO_LAYER_ID,
			type: "symbol",
			source: FACILITIES_SOURCE_ID,
			filter: UNCLUSTERED_FILTER,
			layout: FACILITY_LOGO_LAYOUT,
		});
		applyMapLayerVisibility(map, FACILITIES_LOGO_LAYER_ID, showFacilitiesRef.current);
	}, [areLogosLoaded]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		for (const layerId of FACILITY_MAP_LAYER_IDS) {
			applyMapLayerVisibility(map, layerId, showFacilities);
		}
	}, [isMapReady, showFacilities]);

	return {
		closePanel,
		containerRef,
		hasSessionHeatmap,
		handlePanelClosed,
		hovered,
		isPanelClosing,
		messages: messages.map,
		sessionScale,
		selectedFacilityId,
		status,
	};
}
