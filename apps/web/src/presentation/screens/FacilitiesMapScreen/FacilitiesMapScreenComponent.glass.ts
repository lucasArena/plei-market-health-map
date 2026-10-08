import type { GamesTrendLevel } from "@market-health-map/core/domain";
import type { Map as MapLibreMap } from "maplibre-gl";
import { GAMES_TREND_COLORS } from "@/application/constants/games-trend-colors";
import { PLEI_LOGO_URL, PLEI_LOGO_WHITE_URL } from "@/application/constants/plei-logo";
import {
	clusterTrend,
	facilityTrend,
	trendNumber,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.facilities";
import {
	CLUSTER_BORDER_COLOR,
	CLUSTER_COUNT_LAYER_ID,
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
	CLUSTER_LAYER_ID,
	CLUSTER_MARKER_CLASS,
	CLUSTER_MARKER_HOVER_SCALE,
	CLUSTER_OUTER_DIAMETER,
	CLUSTER_TREND_TIP,
	FACILITIES_LAYER_ID,
	FACILITIES_LOGO_LAYER_ID,
	FACILITY_GLASS_CORE_SIZE,
	FACILITY_GLASS_DIAMETER,
	FACILITY_GLASS_FILL,
	FACILITY_GLASS_INACTIVE_SHADOW,
	FACILITY_GLASS_SELECTED_SHADOW,
	FACILITY_GLASS_SHADOW,
	FACILITY_GLASS_STROKE,
	FACILITY_TREND_TIP,
	facilityGlassRingShadow,
	INACTIVE_GAMES_MARKER_STYLE,
	SELECTED_RING_COLOR,
	TREND_TIP_CLASS,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type {
	ClusterGlassBadge,
	ClusterGlassFeature,
	FacilityGlassBadge,
	FacilityLayerMotion,
	TrendTipShape,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export const FACILITY_MAP_LAYER_IDS = [
	CLUSTER_LAYER_ID,
	CLUSTER_COUNT_LAYER_ID,
	FACILITIES_LAYER_ID,
	FACILITIES_LOGO_LAYER_ID,
] as const;

export function applyMapLayerVisibility(map: MapLibreMap, layerId: string, visible: boolean) {
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

function mapOverlayParent(map: MapLibreMap): HTMLElement | null {
	const canvas = typeof map.getCanvasContainer === "function" ? map.getCanvasContainer() : null;
	if (canvas instanceof HTMLElement) return canvas;
	const container = map.getContainer();
	return container instanceof HTMLElement ? container : null;
}

export function facilityGlassHosts(map: MapLibreMap) {
	const parent = mapOverlayParent(map);
	if (!parent) return [];
	return ["cluster-glass", "facility-glass"].flatMap((testId) => {
		const node = parent.querySelector(`[data-testid='${testId}']`);
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

export function applyGlassTrend(node: HTMLElement, trend: GamesTrendLevel | undefined) {
	if (trend) node.dataset.trendTip = trend;
	else delete node.dataset.trendTip;
	if (trend) node.style.setProperty("--games-trend-color", GAMES_TREND_COLORS[trend]);
	else node.style.removeProperty("--games-trend-color");
}

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

export function nearestGlassPosition(
	positions: readonly { x: number; y: number }[],
	anchor: { x: number; y: number },
) {
	if (positions.length <= 1) return positions[0] ?? anchor;
	let best = positions[0];
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const point of positions) {
		const distance = (point.x - anchor.x) ** 2 + (point.y - anchor.y) ** 2;
		if (distance < bestDistance) {
			bestDistance = distance;
			best = point;
		}
	}
	return best ?? anchor;
}

export function readClusterGlassBadges(
	features: readonly ClusterGlassFeature[],
	project: (coordinates: [number, number]) => { x: number; y: number },
	showGames = false,
	showTrend = false,
	anchor: { x: number; y: number } = { x: 0, y: 0 },
) {
	const byId = new Map<number, ClusterGlassBadge & { positions: { x: number; y: number }[] }>();
	for (const feature of features) {
		const clusterId = feature.properties?.cluster_id;
		const coordinates = clusterGlassCoordinates(feature);
		if (typeof clusterId !== "number" || !coordinates) continue;
		const point = project(coordinates);
		const noGames =
			showGames &&
			trendNumber(feature.properties?.gameCount) === 0 &&
			(!showTrend || trendNumber(feature.properties?.gamePreviousCount) === 0);
		const next: ClusterGlassBadge & { positions: { x: number; y: number }[] } = {
			id: clusterId,
			label: clusterGlassLabel(feature.properties, showGames),
			x: point.x,
			y: point.y,
			active: clusterGlassActive(feature.properties),
			positions: [{ x: point.x, y: point.y }],
			...(showTrend && !noGames ? { trend: clusterTrend(feature.properties).level } : {}),
			...(noGames ? { noGames } : {}),
		};
		const current = byId.get(clusterId);
		if (!current) {
			byId.set(clusterId, next);
			continue;
		}
		current.positions.push({ x: point.x, y: point.y });
	}
	return [...byId.values()].map(({ positions, ...badge }) => {
		const point = nearestGlassPosition(positions, anchor);
		return { ...badge, x: point.x, y: point.y };
	});
}

function ignorePointer(node: HTMLElement) {
	node.style.pointerEvents = "none";
}

function applyGlassCountLabel(label: HTMLElement) {
	label.style.position = "absolute";
	label.style.inset = "0";
	label.style.display = "flex";
	label.style.alignItems = "center";
	label.style.justifyContent = "center";
	label.style.textAlign = "center";
	label.style.fontVariantNumeric = "tabular-nums";
	label.style.whiteSpace = "nowrap";
}

function positionGlassMarker(node: HTMLElement, x: number, y: number, transform: string) {
	node.style.left = `${Math.round(x)}px`;
	node.style.top = `${Math.round(y)}px`;
	node.style.transform = transform;
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

export function clusterGlassActive(properties: ClusterGlassFeature["properties"]) {
	const count = properties?.activeCount;
	return typeof count === "number" && count > 0;
}

export function clusterMarkerTransform(engaged: boolean) {
	const scale = { true: CLUSTER_MARKER_HOVER_SCALE, false: 1 }[`${engaged}`];
	return `translate(-50%, -50%) scale(${scale})`;
}

export function createClusterGlassNode() {
	const node = document.createElement("div");
	node.classList.add(CLUSTER_MARKER_CLASS, "games-count-circle");
	applyGlassDisc(node, CLUSTER_OUTER_DIAMETER, CLUSTER_GLASS_SHADOW);
	const ring = document.createElement("span");
	ring.dataset.testid = "cluster-glass-stroke";
	ring.style.position = "absolute";
	ring.style.boxSizing = "border-box";
	ring.style.inset = `${CLUSTER_GLASS_STROKE_INSET}px`;
	ring.style.borderRadius = "999px";
	ring.style.border = `${CLUSTER_GLASS_STROKE}px solid ${CLUSTER_BORDER_COLOR}`;
	ignorePointer(ring);
	const label = document.createElement("span");
	label.dataset.testid = "cluster-glass-label";
	applyGlassCountLabel(label);
	ignorePointer(label);
	node.append(ring, label);
	node.style.fontSize = "12px";
	node.style.fontWeight = "600";
	node.style.lineHeight = "1";
	applyTrendTipShape(node, CLUSTER_TREND_TIP);
	applyClusterGlassActivity(node, true);
	return node;
}

export function applyClusterGlassActivity(node: HTMLElement, active: boolean) {
	node.dataset.activity = active ? "active" : "inactive";
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
	anchor: { x: number; y: number } = { x: 0, y: 0 },
) {
	const byId = new Map<string, FacilityGlassBadge & { positions: { x: number; y: number }[] }>();
	for (const feature of features) {
		const id = feature.properties?.id;
		const coordinates = clusterGlassCoordinates(feature);
		if (
			typeof feature.properties?.cluster_id === "number" ||
			typeof id !== "string" ||
			!coordinates
		) {
			continue;
		}
		const point = project(coordinates);
		const noGames =
			showGames &&
			trendNumber(feature.properties?.gamesLast28Days) === 0 &&
			(!showTrend || trendNumber(feature.properties?.gamesPrevious28Days) === 0);
		const next: FacilityGlassBadge & { positions: { x: number; y: number }[] } = {
			id,
			x: point.x,
			y: point.y,
			active: facilityGlassActive(feature.properties?.isActive),
			positions: [{ x: point.x, y: point.y }],
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
		};
		const current = byId.get(id);
		if (!current) {
			byId.set(id, next);
			continue;
		}
		current.positions.push({ x: point.x, y: point.y });
	}
	return [...byId.values()].map(({ positions, ...badge }) => {
		const point = nearestGlassPosition(positions, anchor);
		return { ...badge, x: point.x, y: point.y };
	});
}

export function createFacilityGlassNode() {
	const node = document.createElement("div");
	node.classList.add(CLUSTER_MARKER_CLASS);
	applyGlassDisc(node, FACILITY_GLASS_DIAMETER, FACILITY_GLASS_SHADOW);
	const ring = document.createElement("span");
	ring.dataset.testid = "facility-glass-stroke";
	ring.style.position = "absolute";
	ring.style.boxSizing = "border-box";
	ring.style.inset = `${CLUSTER_GLASS_STROKE_INSET}px`;
	ring.style.borderRadius = "999px";
	ring.style.border = `${CLUSTER_GLASS_STROKE}px solid ${CLUSTER_BORDER_COLOR}`;
	ring.style.display = "none";
	ignorePointer(ring);
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
	label.style.fontSize = "12px";
	label.style.fontWeight = "600";
	label.style.lineHeight = "1";
	label.style.display = "none";
	applyGlassCountLabel(label);
	ignorePointer(label);
	node.append(ring, logo, label);
	node.style.backgroundColor = FACILITY_GLASS_FILL;
	return node;
}

export function applyFacilityGlassActivity(node: HTMLElement, active: boolean) {
	node.dataset.activity = active ? "active" : "inactive";
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
	engagedFacilityId: string | null = null,
) {
	const seen = new Set<string>();
	for (const badge of badges) {
		seen.add(badge.id);
		const current = nodes.get(badge.id) ?? createFacilityGlassNode();
		if (!nodes.has(badge.id)) {
			nodes.set(badge.id, current);
			host.appendChild(current);
		}
		const isSelected = badge.id === selectedId;
		const showCount = badge.label !== undefined;
		const restingShadow = {
			[`${badge.active}`]: FACILITY_GLASS_SHADOW,
			[`${!badge.active}`]: FACILITY_GLASS_INACTIVE_SHADOW,
		}.true as string;
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
		current.style.boxShadow = showCount
			? CLUSTER_GLASS_SHADOW
			: badge.noGames && !isSelected
				? CLUSTER_GLASS_SHADOW
				: trendedShadow;
		applyGlassTrend(current, badge.trend);
		applyFacilityGlassActivity(current, badge.active);
		const logo = current.querySelector("[data-testid='facility-glass-core']");
		const label = current.querySelector("[data-testid='facility-glass-label']");
		current.classList.toggle("games-count-circle", showCount);
		const ring = current.querySelector("[data-testid='facility-glass-stroke']");
		if (logo instanceof HTMLElement) logo.style.display = showCount ? "none" : "";
		if (label instanceof HTMLElement) {
			label.textContent = badge.label ?? "";
			label.style.display = showCount ? "flex" : "none";
			label.style.color = badge.active ? CLUSTER_GLASS_LABEL : CLUSTER_GLASS_INACTIVE_LABEL;
		}
		if (ring instanceof HTMLElement) {
			ring.style.display = showCount ? "" : "none";
			if (showCount) {
				const width = CLUSTER_GLASS_STROKE + (isSelected ? 1 : 0);
				const color = badge.trend
					? GAMES_TREND_COLORS[badge.trend]
					: isSelected
						? SELECTED_RING_COLOR
						: badge.active
							? CLUSTER_BORDER_COLOR
							: CLUSTER_GLASS_INACTIVE_STROKE;
				ring.style.border = `${width}px solid ${color}`;
				ring.style.inset = `${CLUSTER_GLASS_STROKE_INSET}px`;
			}
		}
		applyTrendTipShape(current, FACILITY_TREND_TIP);
		current.style.width = `${showCount ? CLUSTER_OUTER_DIAMETER : FACILITY_GLASS_DIAMETER}px`;
		current.style.height = `${showCount ? CLUSTER_OUTER_DIAMETER : FACILITY_GLASS_DIAMETER}px`;
		applyInactiveGamesMarker(
			current,
			badge.noGames === true,
			showCount && badge.noGames === true && ring instanceof HTMLElement ? ring : null,
		);
		positionGlassMarker(
			current,
			badge.x,
			badge.y,
			clusterMarkerTransform(badge.id === engagedFacilityId),
		);
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
		positionGlassMarker(
			current,
			badge.x,
			badge.y,
			clusterMarkerTransform(badge.id === engagedClusterId),
		);
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
	hoveredFacilityIdRef: { current: string | null } = { current: null },
) {
	const container = mapOverlayParent(map);
	if (!container) return;
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
		const center = map.getCenter();
		const anchor = project([center.lng, center.lat]);
		const badges =
			hidden || !map.getLayer(CLUSTER_LAYER_ID)
				? []
				: readClusterGlassBadges(
						map.queryRenderedFeatures({ layers: [CLUSTER_LAYER_ID] }) as ClusterGlassFeature[],
						project,
						showGamesRef.current,
						showTrendRef.current,
						anchor,
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
						anchor,
					);
		syncClusterGlass(host, badges, nodes, hoveredClusterIdRef.current);
		syncFacilityGlass(
			facilityHost,
			facilities,
			facilityNodes,
			selectedFacilityIdRef.current,
			hoveredFacilityIdRef.current,
		);
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
