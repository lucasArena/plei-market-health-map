import type { MapLayerMouseEvent } from "maplibre-gl";
import { clusterGlassActive } from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.glass";
import {
	FACILITY_DOT_ZOOM,
	HOVER_CARD_WIDTH,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type {
	ActiveClusterReveal,
	ClusterGlassFeature,
	ClusterTreeFeature,
	ClusterTreeSource,
	HoverPlacement,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

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

export function clusterFromEvent(event: MapLayerMouseEvent) {
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
