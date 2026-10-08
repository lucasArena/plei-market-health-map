"use client";
import type {
	AppSessionFilters,
	FacilityPointView,
	PlaceView,
} from "@market-health-map/core/application";
import { gamesTrend } from "@market-health-map/core/domain";
import { formatMessage } from "@market-health-map/core/i18n";
import { useQueryClient } from "@tanstack/react-query";
import type {
	GeoJSONSource,
	MapLayerMouseEvent,
	Map as MapLibreMap,
	MapMouseEvent,
} from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { MAP_LAYERS_DEFAULTS } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.defaults";
import type { MarketSearchResult } from "@/presentation/components/map/MapSearch/MapSearchComponent.types";
import {
	ALL_MARKETS_SCOPE,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useAppSessionHeatmap } from "@/presentation/hooks/use-app/use-app-session-heatmap";
import { prefetchFacilityStats } from "@/presentation/hooks/use-facility/prefetch-facility-stats";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { usePleiLogoImages } from "@/presentation/hooks/use-map/use-plei-logo-images";
import { PANEL_SLIDE_MS, useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";
import {
	clusterTrend,
	facilitiesForIds,
	facilitiesForMap,
	facilitiesForPeriod,
	facilityTrend,
	marketBounds,
	toFacilityFeatureCollection,
	trendNumber,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.facilities";
import {
	applyFacilityLayerMotion,
	applyMapLayerVisibility,
	bindFacilityGlass,
	FACILITY_LAYER_ENTER_MS,
	FACILITY_LAYER_EXIT_MS,
	FACILITY_MAP_LAYER_IDS,
	facilityGlassHosts,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.glass";
import {
	appSessionHeatmapScale,
	buildSessionFilterChips,
	EMPTY_HEATMAP,
	profileFilterValues,
	toAppSessionHeatmapFeatureCollection,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.heatmap";
import {
	activeClusterRevealTarget,
	clusterFromEvent,
	clusterHoverPlacement,
	clusterListZoom,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.hover";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_PAINT,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_ACTIVE_COUNT_EXPRESSION,
	CLUSTER_ACTIVE_COUNT_KEY,
	CLUSTER_COUNT_LAYER_ID,
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_HOVER_DISMISS_MS,
	CLUSTER_LAYER_ID,
	CLUSTER_MAX_ZOOM,
	CLUSTER_OUTER_DIAMETER,
	CLUSTER_PAINT,
	CLUSTER_PREVIEW_LIMIT,
	CLUSTER_RADIUS,
	DETAIL_PANEL_OFFSET,
	FACILITIES_LAYER_ID,
	FACILITIES_LOGO_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_LAYOUT,
	FACILITY_DOT_PAINT,
	FACILITY_DOT_ZOOM,
	FACILITY_GLASS_DIAMETER,
	FACILITY_LOGO_LAYOUT,
	FACILITY_LOGO_PAINT,
	GAMES_CLUSTER_PROPERTIES,
	MAP_CENTER,
	MAP_CURSOR,
	MAP_STYLE_URL,
	MAP_ZOOM,
	MAPLIBRE_WORKER_URL,
	REGISTRATION_HEATMAP_PAINT,
	selectedRingColor,
	selectedRingWidth,
	UNCLUSTERED_FILTER,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type {
	FacilitiesMapStatus,
	FacilityTrendCounts,
	MapHover,
	SessionHeatmapScale,
	SessionLegendFilterField,
	SessionLegendState,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export function resolveMapStatus(isPending: boolean, isError: boolean): FacilitiesMapStatus {
	const status = { [`${!isPending}`]: "ready", [`${isError}`]: "error" }.true;
	return (status ?? "loading") as FacilitiesMapStatus;
}

export const PLACE_MAX_ZOOM = 11;

export function useFacilitiesMapScreenRules() {
	const { messages } = useMessages();
	const {
		period,
		scope,
		metricFocus,
		setScope,
		mapNavigation,
		setMapNavigation,
		setSelectedFacilityId: shareSelectedFacilityId,
	} = useMapScope();
	const queryClient = useQueryClient();
	const query = useFacilityListAll();
	const facilities = useMemo(
		() => facilitiesForPeriod(query.data ?? [], period),
		[query.data, period],
	);
	const mapLayers = useMapLayers();
	const showDemographics = useFeatureFlag("player-demographic-filters");
	const isRegistrations = showDemographics && mapLayers?.demandMetric === "registrations";
	const showSupplyFilters = useFeatureFlag("facility-games-layer");
	const showTrendFlag = useFeatureFlag("facility-games-trend");
	const showGames = showSupplyFilters && mapLayers?.supplyMetric === "games";
	const showGamesRef = useRef(showGames);
	showGamesRef.current = showGames;
	const showTrend = showTrendFlag && showGames && (mapLayers?.showGamesTrend ?? false);
	const showTrendRef = useRef(showTrend);
	showTrendRef.current = showTrend;
	const sessionFiltersForHeatmap = showDemographics ? mapLayers?.sessionFilters : {};
	const heatmapQuery = useAppSessionHeatmap(
		isRegistrations
			? { ...sessionFiltersForHeatmap, metric: "registrations" }
			: sessionFiltersForHeatmap,
		period,
		mapLayers?.showSessions ?? true,
	);
	const [isMapReady, setIsMapReady] = useState(false);
	const [hovered, setHovered] = useState<MapHover | null>(null);
	const [sessionScale, setSessionScale] = useState<SessionHeatmapScale>({ low: 0, high: 0 });
	const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
	useEffect(() => {
		shareSelectedFacilityId(selectedFacilityId);
		return () => shareSelectedFacilityId(null);
	}, [selectedFacilityId, shareSelectedFacilityId]);
	const [isPanelClosing, setIsPanelClosing] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const selectedFacilityIdRef = useRef<string | null>(null);
	const showActiveFacilities =
		mapLayers?.showActiveFacilities ?? MAP_LAYERS_DEFAULTS.showActiveFacilities;
	const showInactiveFacilities =
		!showGames && (mapLayers?.showInactiveFacilities ?? MAP_LAYERS_DEFAULTS.showInactiveFacilities);
	const showFacilities = showActiveFacilities || showInactiveFacilities;
	const showSessions = mapLayers?.showSessions ?? MAP_LAYERS_DEFAULTS.showSessions;
	const filters = showDemographics ? mapLayers?.sessionFilters : undefined;
	const sessionFilterChips = buildSessionFilterChips(filters);
	const sessionFilterSummary = sessionFilterChips.map((chip) => chip.label).join(" · ");

	function removeSessionFilter(field: SessionLegendFilterField, id: string) {
		if (!mapLayers) return;
		const applied = mapLayers.sessionFilters;
		if (field === "age") {
			const next: AppSessionFilters = { ...applied };
			delete next.ageMin;
			delete next.ageMax;
			mapLayers.setSessionFilters(next);
			return;
		}
		const values = profileFilterValues(applied[field]).filter(
			(value) => value.toLowerCase() !== id,
		);
		const next: AppSessionFilters = { ...applied };
		if (values.length) next[field] = values;
		else delete next[field];
		mapLayers.setSessionFilters(next);
	}

	const showFacilitiesRef = useRef(showFacilities);
	const facilitiesGlassLiveRef = useRef(showFacilities);
	const facilitiesWereShownRef = useRef(showFacilities);
	showFacilitiesRef.current = showFacilities;
	selectedFacilityIdRef.current = isPanelClosing ? null : selectedFacilityId;
	const hoveredClusterIdRef = useRef<number | null>(null);
	const hoveredFacilityIdRef = useRef<string | null>(null);
	const isDraggingRef = useRef(false);
	const suppressClickRef = useRef(false);
	const refreshClusterMarkersRef = useRef<() => void>(() => undefined);
	const hoverDismissTimerRef = useRef<number | null>(null);
	const gameDepartments = showSupplyFilters ? mapLayers?.gameDepartments : undefined;
	const showMetricFocus = useFeatureFlag("metric-drill-down");
	const scopedFacilities = useMemo(() => {
		if (!showMetricFocus) return facilities;
		return facilities.filter(
			(facility) =>
				(scope.kind !== "market" || facility.marketId === scope.id) &&
				(scope.kind !== "facility" || facility.id === scope.id) &&
				(!metricFocus || metricFocus.facilityIds.includes(facility.id)),
		);
	}, [facilities, scope, metricFocus, showMetricFocus]);
	const focusedDepartments = useMemo(
		() => (showMetricFocus && metricFocus?.department ? [metricFocus.department] : gameDepartments),
		[showMetricFocus, metricFocus?.department, gameDepartments],
	);
	const shownFacilities = useMemo(
		() =>
			facilitiesForMap(scopedFacilities, {
				gameDepartments: focusedDepartments,
				showGames,
				showTrend,
				showActiveFacilities,
				showInactiveFacilities,
			}),
		[
			scopedFacilities,
			showActiveFacilities,
			showInactiveFacilities,
			showGames,
			showTrend,
			focusedDepartments,
		],
	);
	const featureCollection = useMemo(
		() => toFacilityFeatureCollection(shownFacilities),
		[shownFacilities],
	);
	const trendCountsById = useMemo(
		() =>
			new Map<string, FacilityTrendCounts>(
				featureCollection.features.map((feature) => [
					feature.properties.id,
					{
						current: feature.properties.gamesLast28Days ?? 0,
						previous: feature.properties.gamesPrevious28Days ?? 0,
					},
				]),
			),
		[featureCollection],
	);
	const trendCountsRef = useRef(trendCountsById);
	trendCountsRef.current = trendCountsById;

	const heatmapFeatureCollection = useMemo(
		() =>
			heatmapQuery.isError || !heatmapQuery.data
				? EMPTY_HEATMAP
				: toAppSessionHeatmapFeatureCollection(heatmapQuery.data),
		[heatmapQuery.data, heatmapQuery.isError],
	);
	const facilitiesById = useMemo(
		() => new Map(facilities.map((facility) => [facility.id, facility])),
		[facilities],
	);
	const status = resolveMapStatus(query.isPending, query.isError);

	const facilityFromEvent = useCallback(
		(event: MapLayerMouseEvent) => {
			const id = event.features?.[0]?.properties?.id;
			return typeof id === "string" ? (facilitiesById.get(id) ?? null) : null;
		},
		[facilitiesById],
	);

	const cancelHoverDismiss = useCallback(() => {
		if (hoverDismissTimerRef.current === null) return;
		window.clearTimeout(hoverDismissTimerRef.current);
		hoverDismissTimerRef.current = null;
	}, []);

	const clearHover = useCallback(() => {
		hoveredClusterIdRef.current = null;
		hoveredFacilityIdRef.current = null;
		refreshClusterMarkersRef.current();
		setHovered(null);
	}, []);

	const handleHoverEnd = useCallback(() => {
		cancelHoverDismiss();
		clearHover();
	}, [cancelHoverDismiss, clearHover]);

	const scheduleHoverDismiss = useCallback(() => {
		cancelHoverDismiss();
		hoverDismissTimerRef.current = window.setTimeout(() => {
			hoverDismissTimerRef.current = null;
			clearHover();
		}, CLUSTER_HOVER_DISMISS_MS);
	}, [cancelHoverDismiss, clearHover]);

	const hoverViewport = useCallback(() => {
		const container = mapRef.current?.getContainer();
		return {
			width: container?.clientWidth ?? 0,
			height: container?.clientHeight ?? 0,
		};
	}, []);

	const handleHover = useCallback(
		(event: MapLayerMouseEvent) => {
			if (isDraggingRef.current) return;
			const facility = facilityFromEvent(event);
			cancelHoverDismiss();
			if (!facility) {
				clearHover();
				return;
			}
			if (hoveredFacilityIdRef.current === facility.id) return;
			hoveredFacilityIdRef.current = facility.id;
			hoveredClusterIdRef.current = null;
			refreshClusterMarkersRef.current();
			const projected = mapRef.current?.project([
				facility.location.longitude,
				facility.location.latitude,
			]);
			const counts = trendCountsRef.current.get(facility.id);
			setHovered({
				kind: "facility",
				facility,
				...(showGamesRef.current ? { games: counts?.current ?? 0 } : {}),
				...(showTrendRef.current
					? { trend: facilityTrend(counts?.current, counts?.previous) }
					: {}),
				...clusterHoverPlacement(
					{
						x: projected?.x ?? event.point.x,
						y: projected?.y ?? event.point.y,
					},
					hoverViewport(),
				),
			});
			void prefetchFacilityStats(queryClient, facility.id);
		},
		[cancelHoverDismiss, clearHover, facilityFromEvent, hoverViewport, queryClient],
	);

	const handleClusterHover = useCallback(
		(event: MapLayerMouseEvent) => {
			if (isDraggingRef.current) return;
			const cluster = clusterFromEvent(event);
			if (!cluster) return;
			cancelHoverDismiss();
			hoveredFacilityIdRef.current = null;
			const { clusterId, total, center } = cluster;
			const projected = mapRef.current?.project(center);
			const placement = clusterHoverPlacement(
				{
					x: projected?.x ?? event.point.x,
					y: projected?.y ?? event.point.y,
				},
				hoverViewport(),
			);
			if (hoveredClusterIdRef.current === clusterId) {
				setHovered((current) => (current ? { ...current, ...placement } : current));
				return;
			}
			hoveredClusterIdRef.current = clusterId;
			refreshClusterMarkersRef.current();
			setHovered({
				kind: "cluster",
				clusterId,
				total,
				facilities: [],
				...(showGamesRef.current ? { games: trendNumber(cluster.properties?.gameCount) } : {}),
				...(showTrendRef.current ? { trend: clusterTrend(cluster.properties) } : {}),
				...placement,
			});
			const source = mapRef.current?.getSource<GeoJSONSource>(FACILITIES_SOURCE_ID);
			const knownTotal = Number.isFinite(total) && total > 0;
			const leafLimit = { true: total, false: CLUSTER_PREVIEW_LIMIT }[`${knownTotal}`];
			source
				?.getClusterLeaves(clusterId, leafLimit, 0)
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
		[cancelHoverDismiss, facilitiesById, hoverViewport],
	);

	const openFacilityPanel = useCallback(
		(facility: FacilityPointView, zoom?: number) => {
			handleHoverEnd();
			setIsPanelClosing(false);
			setSelectedFacilityId(facility.id);
			const camera = {
				center: [facility.location.longitude, facility.location.latitude] as [number, number],
				padding: { top: 0, bottom: 0, left: 0, right: DETAIL_PANEL_OFFSET },
				duration: 600,
			};
			const motion = { true: { ...camera, zoom }, false: camera }[`${zoom !== undefined}`];
			mapRef.current?.easeTo(motion);
		},
		[handleHoverEnd],
	);

	const selectFacility = useCallback(
		(facility: FacilityPointView) => {
			activityTracker.count("facilitiesOpened");
			const currentZoom = mapRef.current?.getZoom() ?? FACILITY_DOT_ZOOM;
			const dotVisible = currentZoom >= FACILITY_DOT_ZOOM;
			const zoom = { true: undefined, false: clusterListZoom(currentZoom) }[`${dotVisible}`];
			openFacilityPanel(facility, zoom);
		},
		[openFacilityPanel],
	);

	const closePanel = useCallback(() => {
		setIsPanelClosing(true);
		mapRef.current?.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
	}, []);

	const handlePanelClosed = useCallback(() => {
		setSelectedFacilityId(null);
		setIsPanelClosing(false);
	}, []);

	const handleFacilityClick = useCallback(
		(event: MapLayerMouseEvent) => {
			if (suppressClickRef.current) return;
			const facility = facilityFromEvent(event);
			if (!facility) return;
			if (selectedFacilityIdRef.current === facility.id) {
				closePanel();
				return;
			}
			activityTracker.count("facilitiesOpened");
			openFacilityPanel(facility);
		},
		[closePanel, facilityFromEvent, openFacilityPanel],
	);

	const handleMapClick = useCallback(
		(event: MapMouseEvent) => {
			if (suppressClickRef.current) return;
			const map = mapRef.current;
			if (!map || !selectedFacilityIdRef.current) return;
			const layers = [FACILITIES_LAYER_ID, CLUSTER_LAYER_ID].filter((layerId) =>
				map.getLayer(layerId),
			);
			if (layers.length > 0 && map.queryRenderedFeatures(event.point, { layers }).length > 0) {
				return;
			}
			closePanel();
		},
		[closePanel],
	);

	const selectSearchFacility = useCallback(
		(facility: FacilityPointView) => {
			activityTracker.count("facilitiesOpened");
			handleHoverEnd();
			setScope({
				kind: "facility",
				id: facility.id,
				name: facility.name,
				marketName: facility.marketName,
			});
			setIsPanelClosing(false);
			setSelectedFacilityId(facility.id);
			mapRef.current?.easeTo({
				center: [facility.location.longitude, facility.location.latitude],
				zoom: 14,
				padding: { top: 0, bottom: 0, left: 0, right: DETAIL_PANEL_OFFSET },
				duration: 700,
			});
		},
		[handleHoverEnd, setScope],
	);

	const clearSearchScope = useCallback(() => setScope(ALL_MARKETS_SCOPE), [setScope]);

	const selectSearchMarket = useCallback(
		(market: MarketSearchResult) => {
			setScope({ kind: "market", id: market.id, name: market.name });
			const map = mapRef.current;
			const bounds = marketBounds(market.facilities);
			if (!map || !bounds) return;
			setSelectedFacilityId(null);
			setIsPanelClosing(false);
			if (market.facilities.length === 1) {
				const [facility] = market.facilities;
				if (!facility) return;
				map.easeTo({
					center: [facility.location.longitude, facility.location.latitude],
					zoom: 11,
					padding: { top: 0, bottom: 0, left: 0, right: 0 },
					duration: 700,
				});
				return;
			}
			map.fitBounds(bounds, { padding: 72, maxZoom: 11, duration: 700 });
		},
		[setScope],
	);

	useEffect(() => {
		if (!mapNavigation || !isMapReady) return;
		if (mapNavigation.kind === "metric-focus") {
			const targets = facilities.filter((facility) =>
				mapNavigation.facilityIds.includes(facility.id),
			);
			const map = mapRef.current;
			const bounds = marketBounds(targets);
			if (map && targets.length === 1) {
				const [target] = targets;
				if (target)
					map.easeTo({
						center: [target.location.longitude, target.location.latitude],
						zoom: 14,
						padding: { top: 0, bottom: 0, left: 0, right: DETAIL_PANEL_OFFSET },
						duration: 700,
					});
			} else if (map && bounds)
				map.fitBounds(bounds, {
					padding: { top: 72, bottom: 72, left: 72, right: DETAIL_PANEL_OFFSET + 72 },
					maxZoom: 11,
					duration: 700,
				});
		}

		if (mapNavigation.kind === "all") {
			setScope(ALL_MARKETS_SCOPE);
			setSelectedFacilityId(null);
		}
		if (mapNavigation.kind === "facility") {
			const facility = facilities.find((item) => item.id === mapNavigation.id);
			if (facility) selectSearchFacility(facility);
		}
		if (mapNavigation.kind === "market") {
			selectSearchMarket({
				id: mapNavigation.id,
				name: mapNavigation.name,
				facilities: facilities.filter((item) => item.marketId === mapNavigation.id),
			});
		}
		setMapNavigation(null);
	}, [
		mapNavigation,
		isMapReady,
		facilities,
		selectSearchFacility,
		selectSearchMarket,
		setMapNavigation,
		setScope,
	]);

	const selectSearchPlace = useCallback(
		(place: PlaceView) => {
			setScope(ALL_MARKETS_SCOPE);
			setSelectedFacilityId(null);
			setIsPanelClosing(false);
			const map = mapRef.current;
			if (!map) return;
			if (place.bounds) {
				const [west, south, east, north] = place.bounds;
				map.fitBounds(
					[
						[west, south],
						[east, north],
					],
					{ padding: 72, maxZoom: PLACE_MAX_ZOOM, duration: 700 },
				);
				return;
			}
			map.easeTo({
				center: [place.location.longitude, place.location.latitude],
				zoom: PLACE_MAX_ZOOM,
				duration: 700,
			});
		},
		[setScope],
	);

	const handleClusterClick = useCallback(
		(event: MapLayerMouseEvent) => {
			if (suppressClickRef.current) return;
			const cluster = clusterFromEvent(event);
			const map = mapRef.current;
			if (!cluster || !map) return;
			handleHoverEnd();
			const source = map.getSource<GeoJSONSource>(FACILITIES_SOURCE_ID);
			if (!source) return;
			const reveal = cluster.active
				? activeClusterRevealTarget(source, cluster.clusterId, cluster.center, cluster.total)
				: source
						.getClusterExpansionZoom(cluster.clusterId)
						.then((zoom) => ({ zoom, center: cluster.center }));
			reveal
				.then((target) => map.easeTo({ center: target.center, zoom: target.zoom, duration: 500 }))
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
		const nextScale = appSessionHeatmapScale(heatmapQuery.data, bounds, !isRegistrations);
		setSessionScale((current) =>
			current.low === nextScale.low && current.high === nextScale.high ? current : nextScale,
		);
	}, [heatmapQuery.data, heatmapQuery.isError, isRegistrations]);

	const areLogosLoaded = usePleiLogoImages(isMapReady ? mapRef.current : null);
	useExclusiveSidePanel(
		"facility-detail",
		selectedFacilityId !== null && !isPanelClosing,
		closePanel,
	);

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
				dragPan: true,
				renderWorldCopies: false,
			});
			map = created;
			created.getCanvas().style.cursor = MAP_CURSOR.navigate;
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
					clusterProperties: {
						[CLUSTER_ACTIVE_COUNT_KEY]: CLUSTER_ACTIVE_COUNT_EXPRESSION,
						...GAMES_CLUSTER_PROPERTIES,
					},
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
		handleHoverEnd();
		map.getSource<GeoJSONSource>(FACILITIES_SOURCE_ID)?.setData(featureCollection);
	}, [featureCollection, handleHoverEnd, isMapReady]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		if (heatmapQuery.isError || !heatmapQuery.data) {
			map.getSource<GeoJSONSource>(APP_SESSION_HEATMAP_SOURCE_ID)?.setData(EMPTY_HEATMAP);
			setSessionScale((current) =>
				current.high === 0 && current.low === 0 ? current : { low: 0, high: 0 },
			);
			return;
		}
		refreshHeatmap();
	}, [heatmapQuery.data, heatmapQuery.isError, isMapReady, refreshHeatmap]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		const showPointer = () => {
			if (isDraggingRef.current) return;
			map.getCanvas().style.cursor = MAP_CURSOR.interactive;
		};
		const showNavigate = () => {
			map.getCanvas().style.cursor = MAP_CURSOR.navigate;
		};
		const hidePointer = () => {
			if (isDraggingRef.current) return;
			showNavigate();
			scheduleHoverDismiss();
		};
		const startDrag = () => {
			isDraggingRef.current = true;
			suppressClickRef.current = true;
			handleHoverEnd();
			map.getCanvas().style.cursor = MAP_CURSOR.dragging;
		};
		const endDrag = () => {
			isDraggingRef.current = false;
			map.getCanvas().style.cursor = MAP_CURSOR.navigate;
			window.setTimeout(() => {
				suppressClickRef.current = false;
			}, 0);
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
		map.on("click", handleMapClick);
		map.on("dragstart", startDrag);
		map.on("dragend", endDrag);
		map.on("movestart", handleHoverEnd);
		map.on("moveend", refreshHeatmap);
		return () => {
			for (const [event, layer, handler] of bindings) map.off(event, layer, handler);
			map.off("click", handleMapClick);
			map.off("dragstart", startDrag);
			map.off("dragend", endDrag);
			map.off("movestart", handleHoverEnd);
			map.off("moveend", refreshHeatmap);
		};
	}, [
		handleClusterClick,
		handleClusterHover,
		handleFacilityClick,
		handleHover,
		handleHoverEnd,
		handleMapClick,
		isMapReady,
		refreshHeatmap,
		scheduleHoverDismiss,
	]);

	const matchedNothing =
		sessionFilterSummary.length > 0 &&
		heatmapQuery.isSuccess === true &&
		heatmapQuery.isFetching !== true &&
		heatmapFeatureCollection.features.length === 0;
	const sessionQueryStatus =
		{
			[`${matchedNothing}`]: messages.map.sessionFilters.empty,
			[`${heatmapQuery.isError}`]: messages.map.sessionFilters.sessionsError,
			[`${heatmapQuery.isPending}`]: messages.map.sessionFilters.updating,
		}.true ?? "";
	const hasSessionHeatmap = showSessions && heatmapFeatureCollection.features.length > 0;
	const isSessionHeatmapLoading =
		showSessions && !heatmapQuery.isError && (heatmapQuery.isPending || !isMapReady);
	const sessionLegendState = {
		[`${true}`]: "scale",
		[`${sessionScale.high === 0}`]: "empty",
		[`${isSessionHeatmapLoading}`]: "loading",
	}.true as SessionLegendState;

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		const paint = isRegistrations ? REGISTRATION_HEATMAP_PAINT : APP_SESSION_HEATMAP_PAINT;
		for (const property of ["heatmap-intensity", "heatmap-radius"] as const) {
			map.setPaintProperty(APP_SESSION_HEATMAP_LAYER_ID, property, paint?.[property]);
		}
	}, [isMapReady, isRegistrations]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		applyMapLayerVisibility(map, APP_SESSION_HEATMAP_LAYER_ID, showSessions);
	}, [isMapReady, showSessions]);

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
			paint: FACILITY_LOGO_PAINT,
		});
		applyMapLayerVisibility(map, FACILITIES_LOGO_LAYER_ID, showFacilitiesRef.current);
	}, [areLogosLoaded]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		const turnedOn = showFacilities && !facilitiesWereShownRef.current;
		const turnedOff = !showFacilities && facilitiesWereShownRef.current;
		facilitiesWereShownRef.current = showFacilities;
		const hosts = facilityGlassHosts(map);
		const setVisible = (visible: boolean) => {
			for (const layerId of FACILITY_MAP_LAYER_IDS) {
				applyMapLayerVisibility(map, layerId, visible);
			}
		};
		if (turnedOn) {
			facilitiesGlassLiveRef.current = true;
			setVisible(true);
			for (const node of hosts) applyFacilityLayerMotion(node, "enter");
			map.triggerRepaint();
			let settled = false;
			function releaseEnter() {
				if (settled) return;
				settled = true;
				for (const node of hosts) {
					node.classList.remove("facility-layer-in");
					node.removeEventListener("animationend", onEnterEnd);
				}
			}
			function onEnterEnd(event: AnimationEvent) {
				const target = event.target;
				if (!(target instanceof HTMLElement)) return;
				if (!target.classList.contains("facility-layer-in")) return;
				target.classList.remove("facility-layer-in");
				if (hosts.some((node) => node.classList.contains("facility-layer-in"))) return;
				releaseEnter();
			}
			for (const node of hosts) node.addEventListener("animationend", onEnterEnd);
			const enterTimeout = window.setTimeout(releaseEnter, FACILITY_LAYER_ENTER_MS);
			return () => {
				settled = true;
				window.clearTimeout(enterTimeout);
				for (const node of hosts) node.removeEventListener("animationend", onEnterEnd);
			};
		}
		if (!turnedOff) {
			setVisible(showFacilities);
			return;
		}
		handleHoverEnd();
		for (const host of hosts) applyFacilityLayerMotion(host, "exit");
		let settled = false;
		const finishHide = () => {
			if (settled) return;
			settled = true;
			facilitiesGlassLiveRef.current = false;
			setVisible(false);
			for (const host of hosts) {
				host.style.opacity = "0";
				host.classList.remove("facility-layer-in", "facility-layer-out");
			}
			map.triggerRepaint();
		};
		const onEnd = (event: AnimationEvent) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return;
			if (!target.classList.contains("facility-layer-out")) return;
			finishHide();
		};
		const host = hosts[0];
		host?.addEventListener("animationend", onEnd);
		const timeout = window.setTimeout(finishHide, FACILITY_LAYER_EXIT_MS);
		return () => {
			settled = true;
			window.clearTimeout(timeout);
			host?.removeEventListener("animationend", onEnd);
		};
	}, [handleHoverEnd, isMapReady, showFacilities]);

	useEffect(
		() => () => {
			if (hoverDismissTimerRef.current === null) return;
			window.clearTimeout(hoverDismissTimerRef.current);
		},
		[],
	);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		return bindFacilityGlass(
			map,
			facilitiesGlassLiveRef,
			selectedFacilityIdRef,
			hoveredClusterIdRef,
			refreshClusterMarkersRef,
			showGamesRef,
			showTrendRef,
			hoveredFacilityIdRef,
		);
	}, [isMapReady]);

	useEffect(() => {
		if (!isMapReady) return;
		showGamesRef.current = showGames;
		mapRef.current?.setPaintProperty(
			FACILITIES_LAYER_ID,
			"circle-radius",
			showGames ? CLUSTER_OUTER_DIAMETER / 2 : FACILITY_GLASS_DIAMETER / 2,
		);
		refreshClusterMarkersRef.current();
		mapRef.current?.triggerRepaint();
	}, [isMapReady, showGames]);

	useEffect(() => {
		if (!isMapReady) return;
		showTrendRef.current = showTrend;
		refreshClusterMarkersRef.current();
	}, [isMapReady, showTrend]);

	const selectedTrend = useMemo(() => {
		const counts = selectedFacilityId ? trendCountsById.get(selectedFacilityId) : undefined;
		return showTrend && counts ? gamesTrend(counts.current, counts.previous) : null;
	}, [selectedFacilityId, showTrend, trendCountsById]);

	const {
		finishReveal: finishLegendMotion,
		isShown: isLegendShown,
		motion: legendMotion,
	} = useRevealMotion(
		hasSessionHeatmap ||
			isSessionHeatmapLoading ||
			(isRegistrations && showSessions && !heatmapQuery.isError && !!heatmapQuery.data) ||
			(sessionFilterChips.length > 0 && sessionQueryStatus.length > 0),
		PANEL_SLIDE_MS,
	);

	const legendMotionClass = {
		hidden: "",
		enter: "session-legend-in",
		shown: "",
		exit: "session-legend-out",
	}[legendMotion];

	return {
		sessionFilterChips,
		sessionFilterSummary,
		sessionLegendState,
		sessionQueryStatus,
		sessionQueryFailed: heatmapQuery.isError,
		retrySessionHeatmap: () => {
			void heatmapQuery.refetch();
		},
		removeSessionFilter,
		canRemoveSessionFilters: showSessions,
		clearSearchScope,
		closePanel,
		containerRef,
		facilities,
		sessionHeatmapLegend: isRegistrations
			? messages.map.registrationHeatmapLegend
			: formatMessage(messages.map.sessionHeatmapLegend, {
					span: messages.statsPeriods[period].span,
				}),
		finishLegendMotion,
		hasSessionHeatmap,
		handlePanelClosed,
		holdClusterHover: cancelHoverDismiss,
		isLegendShown,
		legendMotionClass,
		hovered,
		isPanelClosing,
		messages: isRegistrations
			? {
					...messages.map,
					sessionHeatmapLegend: messages.map.registrationHeatmapLegend,
					sessionHeatmapContext: messages.map.registrationHeatmapContext,
					sessionHeatmapLoading: messages.map.registrationHeatmapLoading,
					sessionHeatmapNoActivity: messages.map.registrationHeatmapNoActivity,
					sessionHeatmapLowValue: messages.map.registrationHeatmapValue,
					sessionHeatmapMidValue: messages.map.registrationHeatmapValue,
					sessionHeatmapHighValue: messages.map.registrationHeatmapHighValue,
				}
			: messages.map,
		releaseClusterHover: scheduleHoverDismiss,
		selectFacility,
		sessionScale,
		selectedFacilityId,
		selectedTrend,
		selectSearchFacility,
		selectSearchMarket,
		selectSearchPlace,
		showTrend,
		shownFacilities,
		status,
	};
}
