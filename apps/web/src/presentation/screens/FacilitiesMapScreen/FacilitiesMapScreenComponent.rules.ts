"use client";

import type {
	FacilityPointView,
	PlaceView,
	StatsPeriod,
} from "@market-health-map/core/application";
import type {
	GameDepartment,
	GameDepartmentCounts,
	GamesTrendLevel,
} from "@market-health-map/core/domain";
import { type GamesTrend, gamesTrend } from "@market-health-map/core/domain";
import { formatMessage } from "@market-health-map/core/i18n";
import { useQueryClient } from "@tanstack/react-query";
import type { GeoJSONSource, MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAMES_TREND_COLORS } from "@/application/constants/games-trend-colors";
import { PLEI_LOGO_URL, PLEI_LOGO_WHITE_URL } from "@/application/constants/plei-logo";
import { activityTracker } from "@/infrastructure/activity/activity-tracker";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { MAP_LAYERS_DEFAULTS } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.defaults";
import type { MarketSearchResult } from "@/presentation/components/map/MapSearch/MapSearchComponent.types";
import {
	ALL_MARKETS_SCOPE,
	useMapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	type AppSessionHeatmapCellView,
	useAppSessionHeatmap,
} from "@/presentation/hooks/use-app/use-app-session-heatmap";
import { prefetchFacilityStats } from "@/presentation/hooks/use-facility/prefetch-facility-stats";
import { useFacilityListAll } from "@/presentation/hooks/use-facility/use-facility-list-all";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { usePleiLogoImages } from "@/presentation/hooks/use-map/use-plei-logo-images";
import { PANEL_SLIDE_MS, useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";
import { useExclusiveSidePanel } from "@/presentation/hooks/use-side-panel/use-exclusive-side-panel";
import {
	APP_SESSION_HEATMAP_LAYER_ID,
	APP_SESSION_HEATMAP_PAINT,
	APP_SESSION_HEATMAP_SOURCE_ID,
	CLUSTER_ACTIVE_COUNT_EXPRESSION,
	CLUSTER_ACTIVE_COUNT_KEY,
	CLUSTER_BORDER_COLOR,
	CLUSTER_COUNT_LAYER_ID,
	CLUSTER_COUNT_LAYOUT,
	CLUSTER_COUNT_PAINT,
	CLUSTER_FILTER,
	CLUSTER_GLASS_BLUR,
	CLUSTER_GLASS_BORDER,
	CLUSTER_GLASS_FILL,
	CLUSTER_GLASS_HIGHLIGHT,
	CLUSTER_GLASS_INACTIVE_LABEL,
	CLUSTER_GLASS_INACTIVE_STROKE,
	CLUSTER_GLASS_LABEL,
	CLUSTER_GLASS_SATURATE,
	CLUSTER_GLASS_SHADOW,
	CLUSTER_GLASS_STROKE,
	CLUSTER_GLASS_STROKE_INSET,
	CLUSTER_HOVER_DISMISS_MS,
	CLUSTER_LAYER_ID,
	CLUSTER_MARKER_CLASS,
	CLUSTER_MARKER_HOVER_SCALE,
	CLUSTER_MAX_ZOOM,
	CLUSTER_OUTER_DIAMETER,
	CLUSTER_PAINT,
	CLUSTER_PREVIEW_LIMIT,
	CLUSTER_RADIUS,
	CLUSTER_TREND_TIP,
	DETAIL_PANEL_OFFSET,
	FACILITIES_LAYER_ID,
	FACILITIES_LOGO_LAYER_ID,
	FACILITIES_SOURCE_ID,
	FACILITY_DOT_LAYOUT,
	FACILITY_DOT_PAINT,
	FACILITY_DOT_ZOOM,
	FACILITY_GLASS_CORE_SIZE,
	FACILITY_GLASS_DIAMETER,
	FACILITY_GLASS_FILL,
	FACILITY_GLASS_INACTIVE_SHADOW,
	FACILITY_GLASS_SELECTED_SHADOW,
	FACILITY_GLASS_SHADOW,
	FACILITY_GLASS_STROKE,
	FACILITY_LOGO_LAYOUT,
	FACILITY_LOGO_PAINT,
	FACILITY_TREND_TIP,
	facilityGlassRingShadow,
	GAMES_CLUSTER_PROPERTIES,
	HOVER_CARD_WIDTH,
	INACTIVE_GAMES_MARKER_STYLE,
	MAP_CENTER,
	MAP_STYLE_URL,
	MAP_ZOOM,
	MAPLIBRE_WORKER_URL,
	REGISTRATION_HEATMAP_PAINT,
	selectedRingColor,
	selectedRingWidth,
	TREND_TIP_CLASS,
	type TrendTipShape,
	UNCLUSTERED_FILTER,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type {
	ActiveClusterReveal,
	AppSessionHeatmapFeatureCollection,
	ClusterGlassBadge,
	ClusterGlassFeature,
	ClusterTreeFeature,
	ClusterTreeSource,
	FacilitiesMapStatus,
	FacilityFeatureCollection,
	FacilityGlassBadge,
	FacilityLayerMotion,
	FacilityTrendCounts,
	HoverPlacement,
	MapHover,
	SessionHeatmapArea,
	SessionHeatmapBounds,
	SessionHeatmapScale,
	SessionLegendState,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export function facilitiesForPeriod(
	facilities: FacilityPointView[],
	period: StatsPeriod,
): FacilityPointView[] {
	if (period === "month") return facilities;
	return facilities.map((facility) => ({
		...facility,
		isActive: facility.isActiveLastWeek,
		gamesLast28Days: facility.gamesLastWeek,
		gamesByDepartment: facility.gamesLastWeekByDepartment,
		gamesPrevious28Days: facility.gamesPreviousWeek,
		gamesPreviousByDepartment: facility.gamesPreviousWeekByDepartment,
	}));
}

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
				marketName: facility.marketName,
				name: facility.name,
				isActive: facility.isActive,
				gamesLast28Days: facility.gamesLast28Days ?? 0,
				gamesPrevious28Days: facility.gamesPrevious28Days ?? 0,
			},
		})),
	};
}

function sumDepartments(
	counts: GameDepartmentCounts | undefined,
	departments: readonly GameDepartment[],
) {
	return departments.reduce((sum, department) => sum + (counts?.[department] ?? 0), 0);
}

/**
 * Applies the supply filters to facilities. Selected departments narrow both windows. With
 * the trend on, facilities with no games now but games in the previous window stay on the map
 * so their drop is visible; with it off the result matches the map without trends.
 */
export function facilitiesForMap(
	facilities: readonly FacilityPointView[],
	options: {
		gameDepartments?: readonly GameDepartment[];
		showGames: boolean;
		showTrend: boolean;
		showActiveFacilities: boolean;
		showInactiveFacilities: boolean;
	},
): FacilityPointView[] {
	const { gameDepartments, showGames, showTrend, showActiveFacilities, showInactiveFacilities } =
		options;
	return facilities
		.map((facility) => {
			if (!gameDepartments?.length) return facility;
			return {
				...facility,
				gamesLast28Days: sumDepartments(facility.gamesByDepartment, gameDepartments),
				gamesPrevious28Days: sumDepartments(facility.gamesPreviousByDepartment, gameDepartments),
			};
		})
		.filter((facility) => {
			const hasGames =
				(facility.gamesLast28Days ?? 0) > 0 ||
				(showTrend && (facility.gamesPrevious28Days ?? 0) > 0);
			if (gameDepartments?.length && !hasGames) return false;
			if (showGames) return showActiveFacilities && hasGames;
			return facility.isActive ? showActiveFacilities : showInactiveFacilities;
		});
}

function trendNumber(value: unknown) {
	const count = Number(value ?? 0);
	return Number.isFinite(count) ? count : 0;
}

/** A facility's games trend, the same classifier its cluster uses. */
export function facilityTrend(current: unknown, previous: unknown): GamesTrend {
	return gamesTrend(trendNumber(current), trendNumber(previous));
}

/** Cluster trends come from the summed windows MapLibre keeps on the cluster. */
export function clusterTrend(properties: ClusterGlassFeature["properties"]): GamesTrend {
	return gamesTrend(trendNumber(properties?.gameCount), trendNumber(properties?.gamePreviousCount));
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
	aggregateAreas = true,
): SessionHeatmapScale {
	const visibleCells = bounds
		? cells.filter((cell) => bounds.contains([cell.lng, cell.lat]))
		: cells;
	const scaleCells = aggregateAreas ? appSessionHeatmapAreas(cells, bounds) : visibleCells;
	const sortedWeights = scaleCells
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

export function marketBounds(
	facilities: FacilityPointView[],
): [[number, number], [number, number]] | null {
	if (facilities.length === 0) return null;
	const longitudes = facilities.map((facility) => facility.location.longitude);
	const latitudes = facilities.map((facility) => facility.location.latitude);
	return [
		[Math.min(...longitudes), Math.min(...latitudes)],
		[Math.max(...longitudes), Math.max(...latitudes)],
	];
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

export function clusterListZoom(currentZoom: number, unclusterZoom = FACILITY_DOT_ZOOM) {
	return Math.max(currentZoom, unclusterZoom);
}

export function clusterHoverPlacement(
	center: { x: number; y: number },
	viewport: { width: number; height: number },
): HoverPlacement & { viewport: { width: number; height: number } } {
	return {
		x: center.x,
		y: center.y,
		flipX: false,
		flipY: false,
		viewport,
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
		active: clusterGlassActive(feature.properties),
		properties: feature.properties as ClusterGlassFeature["properties"],
	};
}

function clusterTreeCoordinates(feature: ClusterTreeFeature): [number, number] | null {
	const geometry = feature.geometry;
	if (!geometry || typeof geometry !== "object" || !("coordinates" in geometry)) return null;
	const coordinates = geometry.coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
	const longitude = coordinates[0];
	const latitude = coordinates[1];
	if (typeof longitude !== "number" || typeof latitude !== "number") return null;
	return [longitude, latitude];
}

function leafIsActive(value: unknown) {
	if (value === undefined || value === null) return false;
	return value !== false && value !== 0 && value !== "0" && value !== "false";
}

function leafId(feature: ClusterTreeFeature) {
	const id = feature.properties?.id;
	if (typeof id !== "string" && typeof id !== "number") return null;
	return String(id);
}

function distanceSquared(origin: [number, number], point: [number, number]) {
	const longitude = origin[0] - point[0];
	const latitude = origin[1] - point[1];
	return longitude * longitude + latitude * latitude;
}

function nearestActiveLeaf(
	leaves: readonly { id: string; coordinates: [number, number] }[],
	origin: [number, number],
) {
	const first = leaves[0];
	if (!first) return null;
	let nearest = first;
	for (const leaf of leaves) {
		const closer =
			distanceSquared(origin, leaf.coordinates) < distanceSquared(origin, nearest.coordinates);
		if (closer) nearest = leaf;
	}
	return nearest;
}

export async function activeClusterRevealTarget(
	source: ClusterTreeSource,
	clusterId: number,
	fallbackCenter: [number, number],
	limit: number,
): Promise<ActiveClusterReveal> {
	const leafLimit = Math.max(limit, 1);
	const leaves = await source.getClusterLeaves(clusterId, leafLimit, 0);
	const activeLeaves = leaves.flatMap((leaf) => {
		const coordinates = clusterTreeCoordinates(leaf);
		const id = leafId(leaf);
		if (!coordinates || !id || !leafIsActive(leaf.properties?.isActive)) return [];
		return [{ id, coordinates }];
	});
	const target = nearestActiveLeaf(activeLeaves, fallbackCenter);
	if (!target) {
		return {
			zoom: await source.getClusterExpansionZoom(clusterId),
			center: fallbackCenter,
		};
	}
	let currentId = clusterId;
	const seen = new Set<number>();
	while (!seen.has(currentId)) {
		seen.add(currentId);
		const zoom = await source.getClusterExpansionZoom(currentId);
		const children = await source.getClusterChildren(currentId);
		const revealed = children.some(
			(child) => !child.properties?.cluster && leafId(child) === target.id,
		);
		if (revealed) return { zoom, center: target.coordinates };
		let nextId: number | undefined;
		for (const child of children) {
			const childId = child.properties?.cluster_id;
			if (!child.properties?.cluster || typeof childId !== "number") continue;
			const childLimit = Math.max(child.properties.point_count ?? leafLimit, 1);
			const childLeaves = await source.getClusterLeaves(childId, childLimit, 0);
			if (!childLeaves.some((leaf) => leafId(leaf) === target.id)) continue;
			nextId = childId;
			break;
		}
		if (nextId === undefined) return { zoom, center: target.coordinates };
		currentId = nextId;
	}
	return {
		zoom: await source.getClusterExpansionZoom(clusterId),
		center: target.coordinates,
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

export const FACILITY_LAYER_ENTER_MS = 240;
export const FACILITY_LAYER_EXIT_MS = 200;

export function applyFacilityLayerMotion(host: HTMLElement, motion: FacilityLayerMotion) {
	host.classList.remove("facility-layer-in", "facility-layer-out");
	if (motion === "enter") host.style.opacity = "0";
	void host.offsetWidth;
	host.style.opacity = "";
	host.classList.add(
		{
			enter: "facility-layer-in",
			exit: "facility-layer-out",
		}[motion],
	);
}

function facilityGlassHosts(map: MapLibreMap) {
	const container = map.getContainer();
	if (!(container instanceof HTMLElement)) return [];
	return ["cluster-glass", "facility-glass"].flatMap((testId) => {
		const node = container.querySelector(`[data-testid='${testId}']`);
		return node instanceof HTMLElement ? [node] : [];
	});
}

const supplyCountFormatter = new Intl.NumberFormat("en", {
	notation: "compact",
	maximumFractionDigits: 1,
});

function formatSupplyCount(count: number) {
	return count >= 1000 ? supplyCountFormatter.format(count) : String(count);
}

function clusterGlassLabel(properties: ClusterGlassFeature["properties"], showGames: boolean) {
	if (showGames) return formatSupplyCount(properties?.gameCount ?? 0);
	const abbreviated = properties?.point_count_abbreviated;
	if (typeof abbreviated === "string" || typeof abbreviated === "number")
		return String(abbreviated);
	const count = properties?.point_count;
	if (typeof count === "number") return String(count);
	return "";
}

function clusterGlassCoordinates(feature: ClusterGlassFeature): [number, number] | null {
	const coordinates = feature.geometry?.coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
	const longitude = coordinates[0];
	const latitude = coordinates[1];
	if (typeof longitude !== "number" || typeof latitude !== "number") return null;
	return [longitude, latitude];
}

/** Gives a glass disc its trend tip shape; the tip only shows with a data-trend-tip. */
function applyTrendTipShape(node: HTMLElement, tip: TrendTipShape) {
	const size = String(tip.box);
	if (node.dataset.trendTipBox === size) return;
	node.dataset.trendTipBox = size;
	node.classList.add(TREND_TIP_CLASS);
	node.style.setProperty("--games-trend-tip-box", `${tip.box}px`);
	node.style.setProperty("--games-trend-inner", `${tip.inner}px`);
	node.style.setProperty("--games-trend-shape-up", tip.up);
	node.style.setProperty("--games-trend-shape-down", tip.down);
	node.style.setProperty("--games-trend-shape-stable", tip.stable);
}

/** Paints the glass trend ring, with a tip for up and down; trend off paints nothing. */
export function applyGlassTrend(node: HTMLElement, trend: GamesTrendLevel | undefined) {
	if (trend) node.dataset.trendTip = trend;
	else delete node.dataset.trendTip;
	if (trend) node.style.setProperty("--games-trend-color", GAMES_TREND_COLORS[trend]);
	else node.style.removeProperty("--games-trend-color");
}

/**
 * Games layer markers with no games now: the inactive marker style on the existing disc (and
 * the cluster's ring span), reset with the rest of the glass on every sync. Never a trend.
 */
export function applyInactiveGamesMarker(
	node: HTMLElement,
	inactive: boolean,
	ring: HTMLElement | null = null,
) {
	const style = INACTIVE_GAMES_MARKER_STYLE;
	if (inactive) node.dataset.inactive = "true";
	else delete node.dataset.inactive;
	node.style.opacity = inactive ? String(style.opacity) : "";
	if (ring) {
		ring.style.borderStyle = inactive ? style.ringStyle : "solid";
		ring.style.borderWidth = `${inactive ? style.ringWidth : CLUSTER_GLASS_STROKE}px`;
		if (inactive) ring.style.borderColor = style.ringColor;
	} else if (inactive) {
		node.style.border = `${style.ringWidth}px ${style.ringStyle} ${style.ringColor}`;
	}
	const label = node.querySelector("[data-testid$='-glass-label']");
	if (inactive && label instanceof HTMLElement) label.style.color = style.label;
}

export function readClusterGlassBadges(
	features: readonly ClusterGlassFeature[],
	project: (coordinates: [number, number]) => { x: number; y: number },
	showGames = false,
	showTrend = false,
) {
	const seen = new Set<number>();
	const badges: ClusterGlassBadge[] = [];
	for (const feature of features) {
		const clusterId = feature.properties?.cluster_id;
		const coordinates = clusterGlassCoordinates(feature);
		if (typeof clusterId !== "number" || !coordinates || seen.has(clusterId)) continue;
		seen.add(clusterId);
		const point = project(coordinates);
		const noGames =
			showGames &&
			trendNumber(feature.properties?.gameCount) === 0 &&
			(!showTrend || trendNumber(feature.properties?.gamePreviousCount) === 0);
		badges.push({
			id: clusterId,
			label: clusterGlassLabel(feature.properties, showGames),
			x: point.x,
			y: point.y,
			active: clusterGlassActive(feature.properties),
			...(showTrend && !noGames ? { trend: clusterTrend(feature.properties).level } : {}),
			...(noGames ? { noGames } : {}),
		});
	}
	return badges;
}

function ignorePointer(node: HTMLElement) {
	node.style.pointerEvents = "none";
}

function applyGlassDisc(node: HTMLElement, diameter: number, shadow: string) {
	ignorePointer(node);
	node.style.position = "absolute";
	node.style.boxSizing = "border-box";
	node.style.display = "flex";
	node.style.alignItems = "center";
	node.style.justifyContent = "center";
	node.style.width = `${diameter}px`;
	node.style.height = `${diameter}px`;
	node.style.borderRadius = "999px";
	node.style.border = `1px solid ${CLUSTER_GLASS_BORDER}`;
	node.style.backgroundColor = CLUSTER_GLASS_FILL;
	node.style.backgroundImage = CLUSTER_GLASS_HIGHLIGHT;
	node.style.boxShadow = shadow;
	node.style.backdropFilter = `blur(${CLUSTER_GLASS_BLUR}px) saturate(${CLUSTER_GLASS_SATURATE})`;
	node.style.setProperty(
		"-webkit-backdrop-filter",
		`blur(${CLUSTER_GLASS_BLUR}px) saturate(${CLUSTER_GLASS_SATURATE})`,
	);
}

function clusterGlassActive(properties: ClusterGlassFeature["properties"]) {
	const count = properties?.activeCount;
	return typeof count === "number" && count > 0;
}

export function clusterMarkerTransform(engaged: boolean) {
	const scale = { true: CLUSTER_MARKER_HOVER_SCALE, false: 1 }[`${engaged}`];
	return `translate(-50%, -50%) scale(${scale})`;
}

export function createClusterGlassNode() {
	const node = document.createElement("div");
	node.classList.add(CLUSTER_MARKER_CLASS);
	applyGlassDisc(node, CLUSTER_OUTER_DIAMETER, CLUSTER_GLASS_SHADOW);
	const ring = document.createElement("span");
	const ringDiameter = CLUSTER_OUTER_DIAMETER - CLUSTER_GLASS_STROKE_INSET * 2;
	ring.dataset.testid = "cluster-glass-stroke";
	ring.style.position = "absolute";
	ring.style.boxSizing = "border-box";
	ring.style.width = `${ringDiameter}px`;
	ring.style.height = `${ringDiameter}px`;
	ring.style.left = "50%";
	ring.style.top = "50%";
	ring.style.transform = "translate(-50%, -50%)";
	ring.style.borderRadius = "999px";
	ring.style.border = `${CLUSTER_GLASS_STROKE}px solid ${CLUSTER_BORDER_COLOR}`;
	ignorePointer(ring);
	const label = document.createElement("span");
	label.dataset.testid = "cluster-glass-label";
	ignorePointer(label);
	node.append(ring, label);
	node.style.fontSize = "14px";
	node.style.fontWeight = "600";
	node.style.lineHeight = "1";
	applyTrendTipShape(node, CLUSTER_TREND_TIP);
	applyClusterGlassActivity(node, true);
	return node;
}

export function applyClusterGlassActivity(node: HTMLElement, active: boolean) {
	const ring = node.querySelector("[data-testid='cluster-glass-stroke']");
	const label = node.querySelector("[data-testid='cluster-glass-label']");
	const labelColor = {
		[`${active}`]: CLUSTER_GLASS_LABEL,
		[`${!active}`]: CLUSTER_GLASS_INACTIVE_LABEL,
	}.true as string;
	const ringColor = {
		[`${active}`]: CLUSTER_BORDER_COLOR,
		[`${!active}`]: CLUSTER_GLASS_INACTIVE_STROKE,
	}.true as string;
	const glassBlur = `blur(${CLUSTER_GLASS_BLUR}px) saturate(${CLUSTER_GLASS_SATURATE})`;
	node.style.backgroundColor = CLUSTER_GLASS_FILL;
	node.style.backgroundImage = CLUSTER_GLASS_HIGHLIGHT;
	node.style.border = `1px solid ${CLUSTER_GLASS_BORDER}`;
	node.style.boxShadow = CLUSTER_GLASS_SHADOW;
	node.style.color = labelColor;
	node.style.backdropFilter = glassBlur;
	node.style.setProperty("-webkit-backdrop-filter", glassBlur);
	if (ring instanceof HTMLElement) ring.style.borderColor = ringColor;
	if (label instanceof HTMLElement) label.style.color = labelColor;
}

function facilityGlassActive(active: unknown) {
	return active !== false && active !== 0 && active !== "0" && active !== "false";
}

export function readFacilityGlassBadges(
	features: readonly ClusterGlassFeature[],
	project: (coordinates: [number, number]) => { x: number; y: number },
	showGames = false,
	showTrend = false,
) {
	const seen = new Set<string>();
	const badges: FacilityGlassBadge[] = [];
	for (const feature of features) {
		const id = feature.properties?.id;
		const coordinates = clusterGlassCoordinates(feature);
		if (
			typeof feature.properties?.cluster_id === "number" ||
			typeof id !== "string" ||
			!coordinates ||
			seen.has(id)
		) {
			continue;
		}
		seen.add(id);
		const point = project(coordinates);
		const noGames =
			showGames &&
			trendNumber(feature.properties?.gamesLast28Days) === 0 &&
			(!showTrend || trendNumber(feature.properties?.gamesPrevious28Days) === 0);
		badges.push({
			id,
			x: point.x,
			y: point.y,
			active: facilityGlassActive(feature.properties?.isActive),
			...(showGames ? { label: formatSupplyCount(feature.properties?.gamesLast28Days ?? 0) } : {}),
			...(noGames ? { noGames } : {}),
			...(showTrend && !noGames
				? {
						trend: facilityTrend(
							feature.properties?.gamesLast28Days,
							feature.properties?.gamesPrevious28Days,
						).level,
					}
				: {}),
		});
	}
	return badges;
}

export function createFacilityGlassNode() {
	const node = document.createElement("div");
	applyGlassDisc(node, FACILITY_GLASS_DIAMETER, FACILITY_GLASS_SHADOW);
	const logo = document.createElement("img");
	logo.dataset.testid = "facility-glass-core";
	logo.alt = "";
	logo.src = PLEI_LOGO_URL;
	logo.draggable = false;
	logo.style.width = `${FACILITY_GLASS_CORE_SIZE}px`;
	logo.style.height = `${FACILITY_GLASS_CORE_SIZE}px`;
	logo.style.objectFit = "contain";
	logo.style.borderRadius = "999px";
	ignorePointer(logo);
	const label = document.createElement("span");
	label.dataset.testid = "facility-glass-label";
	label.style.fontSize = "14px";
	label.style.fontWeight = "600";
	label.style.lineHeight = "1";
	label.style.display = "none";
	ignorePointer(label);
	node.append(logo, label);
	node.style.backgroundColor = FACILITY_GLASS_FILL;
	return node;
}

export function applyFacilityGlassActivity(node: HTMLElement, active: boolean) {
	const logo = node.querySelector("[data-testid='facility-glass-core']");
	const logoSrc = {
		[`${active}`]: PLEI_LOGO_URL,
		[`${!active}`]: PLEI_LOGO_WHITE_URL,
	}.true as string;
	if (logo instanceof HTMLImageElement) {
		logo.src = logoSrc;
		logo.style.filter = "none";
		logo.style.opacity = "1";
	}
	const glassBlur = `blur(${CLUSTER_GLASS_BLUR}px) saturate(${CLUSTER_GLASS_SATURATE})`;
	node.style.backgroundColor = FACILITY_GLASS_FILL;
	node.style.backgroundImage = CLUSTER_GLASS_HIGHLIGHT;
	node.style.border = `1px solid ${CLUSTER_GLASS_BORDER}`;
	node.style.backdropFilter = glassBlur;
	node.style.setProperty("-webkit-backdrop-filter", glassBlur);
}

export function syncFacilityGlass(
	host: HTMLElement,
	badges: readonly FacilityGlassBadge[],
	nodes: Map<string, HTMLElement>,
	selectedId: string | null = null,
) {
	const seen = new Set<string>();
	for (const badge of badges) {
		seen.add(badge.id);
		const current = nodes.get(badge.id) ?? createFacilityGlassNode();
		if (!nodes.has(badge.id)) {
			nodes.set(badge.id, current);
			host.appendChild(current);
		}
		const restingShadow = {
			[`${badge.active}`]: FACILITY_GLASS_SHADOW,
			[`${!badge.active}`]: FACILITY_GLASS_INACTIVE_SHADOW,
		}.true as string;
		const isSelected = badge.id === selectedId;
		const untrendedShadow = {
			[`${true}`]: restingShadow,
			[`${isSelected}`]: FACILITY_GLASS_SELECTED_SHADOW,
		}.true as string;
		const trendedShadow = badge.trend
			? facilityGlassRingShadow(
					GAMES_TREND_COLORS[badge.trend],
					FACILITY_GLASS_STROKE + (isSelected ? 1 : 0),
				)
			: untrendedShadow;
		// The inactive marker draws its ring as the disc border, so its shadow carries no ring.
		current.style.boxShadow = badge.noGames && !isSelected ? CLUSTER_GLASS_SHADOW : trendedShadow;
		applyGlassTrend(current, badge.trend);
		applyFacilityGlassActivity(current, badge.active);
		const logo = current.querySelector("[data-testid='facility-glass-core']");
		const label = current.querySelector("[data-testid='facility-glass-label']");
		const showCount = badge.label !== undefined;
		if (logo instanceof HTMLElement) logo.style.display = showCount ? "none" : "";
		if (label instanceof HTMLElement) {
			label.textContent = badge.label ?? "";
			label.style.display = showCount ? "" : "none";
			label.style.color = badge.active ? CLUSTER_GLASS_LABEL : CLUSTER_GLASS_INACTIVE_LABEL;
		}
		applyTrendTipShape(current, FACILITY_TREND_TIP);
		current.style.width = `${showCount ? CLUSTER_OUTER_DIAMETER : FACILITY_GLASS_DIAMETER}px`;
		current.style.height = `${showCount ? CLUSTER_OUTER_DIAMETER : FACILITY_GLASS_DIAMETER}px`;
		applyInactiveGamesMarker(current, badge.noGames === true);
		current.style.transform = `translate(${badge.x}px, ${badge.y}px) translate(-50%, -50%)`;
	}
	for (const [id, node] of nodes) {
		if (seen.has(id)) continue;
		node.remove();
		nodes.delete(id);
	}
}

export function syncClusterGlass(
	host: HTMLElement,
	badges: readonly ClusterGlassBadge[],
	nodes: Map<number, HTMLElement>,
	engagedClusterId: number | null = null,
) {
	const seen = new Set<number>();
	for (const badge of badges) {
		seen.add(badge.id);
		const current = nodes.get(badge.id) ?? createClusterGlassNode();
		if (!nodes.has(badge.id)) {
			nodes.set(badge.id, current);
			host.appendChild(current);
		}
		const label = current.querySelector("[data-testid='cluster-glass-label']");
		if (label) label.textContent = badge.label;
		applyClusterGlassActivity(current, badge.active);
		applyGlassTrend(current, badge.trend);
		const ring = current.querySelector("[data-testid='cluster-glass-stroke']");
		if (ring instanceof HTMLElement) {
			if (badge.trend) ring.style.borderColor = GAMES_TREND_COLORS[badge.trend];
			applyInactiveGamesMarker(current, badge.noGames === true, ring);
		}
		current.style.left = `${badge.x}px`;
		current.style.top = `${badge.y}px`;
		current.style.transform = clusterMarkerTransform(badge.id === engagedClusterId);
	}
	for (const [id, node] of nodes) {
		if (seen.has(id)) continue;
		node.remove();
		nodes.delete(id);
	}
}

export function bindFacilityGlass(
	map: MapLibreMap,
	showFacilitiesRef: { current: boolean },
	selectedFacilityIdRef: { current: string | null },
	hoveredClusterIdRef: { current: number | null } = { current: null },
	refreshClusterMarkersRef: { current: () => void } = { current: () => undefined },
	showGamesRef: { current: boolean } = { current: false },
	showTrendRef: { current: boolean } = { current: false },
) {
	const container = map.getContainer();
	if (!(container instanceof HTMLElement)) return;
	const host = document.createElement("div");
	host.dataset.testid = "cluster-glass";
	const facilityHost = document.createElement("div");
	facilityHost.dataset.testid = "facility-glass";
	for (const node of [host, facilityHost]) {
		node.style.position = "absolute";
		node.style.inset = "0";
		node.style.pointerEvents = "none";
		node.style.zIndex = "1";
		container.appendChild(node);
	}
	const nodes = new Map<number, HTMLElement>();
	const facilityNodes = new Map<string, HTMLElement>();
	const project = (coordinates: [number, number]) => {
		const point = map.project(coordinates);
		return { x: point.x, y: point.y };
	};
	const sync = () => {
		const hidden = !showFacilitiesRef.current;
		const badges =
			hidden || !map.getLayer(CLUSTER_LAYER_ID)
				? []
				: readClusterGlassBadges(
						map.queryRenderedFeatures({ layers: [CLUSTER_LAYER_ID] }) as ClusterGlassFeature[],
						project,
						showGamesRef.current,
						showTrendRef.current,
					);
		const facilities =
			hidden || !map.getLayer(FACILITIES_LAYER_ID)
				? []
				: readFacilityGlassBadges(
						map.queryRenderedFeatures({
							layers: [FACILITIES_LAYER_ID],
						}) as ClusterGlassFeature[],
						project,
						showGamesRef.current,
						showTrendRef.current,
					);
		syncClusterGlass(host, badges, nodes, hoveredClusterIdRef.current);
		syncFacilityGlass(facilityHost, facilities, facilityNodes, selectedFacilityIdRef.current);
	};
	refreshClusterMarkersRef.current = sync;
	map.on("render", sync);
	sync();
	return () => {
		refreshClusterMarkersRef.current = () => undefined;
		map.off("render", sync);
		host.remove();
		facilityHost.remove();
	};
}

export const PLACE_MAX_ZOOM = 11;

export function useFacilitiesMapScreenRules() {
	const { messages } = useMessages();
	const { period, setScope, setSelectedFacilityId: shareSelectedFacilityId } = useMapScope();
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
	/** The trend flag already implies games (the server lists it only with games on). */
	const showTrendFlag = useFeatureFlag("facility-games-trend");
	const showGames = showSupplyFilters && mapLayers?.supplyMetric === "games";
	const showGamesRef = useRef(showGames);
	showGamesRef.current = showGames;
	const showTrend = showTrendFlag && showGames && (mapLayers?.showGamesTrend ?? false);
	const showTrendRef = useRef(showTrend);
	showTrendRef.current = showTrend;
	const heatmapQuery = useAppSessionHeatmap(
		isRegistrations
			? { ...mapLayers?.sessionFilters, metric: "registrations" }
			: mapLayers?.sessionFilters,
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
	const filters = mapLayers?.sessionFilters;
	const ageLabel =
		filters?.ageMin === filters?.ageMax
			? String(filters?.ageMin ?? "")
			: filters?.ageMin === undefined
				? `≤ ${filters?.ageMax}`
				: filters?.ageMax === undefined
					? `${filters.ageMin}+`
					: `${filters.ageMin}–${filters.ageMax}`;
	const sessionFilterSummary = [
		(Array.isArray(filters?.gender) ? filters.gender : filters?.gender ? [filters.gender] : [])
			.map((value) => value.charAt(0).toUpperCase() + value.slice(1))
			.join(", "),
		Array.isArray(filters?.skill) ? filters.skill.join(", ") : filters?.skill,
		ageLabel,
	]
		.filter(Boolean)
		.join(" · ");

	const showFacilitiesRef = useRef(showFacilities);
	const facilitiesGlassLiveRef = useRef(showFacilities);
	const facilitiesWereShownRef = useRef(showFacilities);
	showFacilitiesRef.current = showFacilities;
	selectedFacilityIdRef.current = isPanelClosing ? null : selectedFacilityId;
	const hoveredClusterIdRef = useRef<number | null>(null);
	const hoveredFacilityIdRef = useRef<string | null>(null);
	const refreshClusterMarkersRef = useRef<() => void>(() => undefined);
	const hoverDismissTimerRef = useRef<number | null>(null);
	const gameDepartments = showSupplyFilters ? mapLayers?.gameDepartments : undefined;
	const shownFacilities = useMemo(
		() =>
			facilitiesForMap(facilities, {
				gameDepartments,
				showGames,
				showTrend,
				showActiveFacilities,
				showInactiveFacilities,
			}),
		[
			facilities,
			showActiveFacilities,
			showInactiveFacilities,
			showGames,
			showTrend,
			gameDepartments,
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

	const handleFacilityClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const facility = facilityFromEvent(event);
			if (!facility) return;
			activityTracker.count("facilitiesOpened");
			openFacilityPanel(facility);
		},
		[facilityFromEvent, openFacilityPanel],
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
			map.getCanvas().style.cursor = "pointer";
		};
		const hidePointer = () => {
			map.getCanvas().style.cursor = "";
			scheduleHoverDismiss();
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
		scheduleHoverDismiss,
	]);

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
			(isRegistrations && showSessions && !heatmapQuery.isError && !!heatmapQuery.data),
		PANEL_SLIDE_MS,
	);

	const legendMotionClass = {
		hidden: "",
		enter: "session-legend-in",
		shown: "",
		exit: "session-legend-out",
	}[legendMotion];

	return {
		sessionFilterSummary,
		sessionLegendState,
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
