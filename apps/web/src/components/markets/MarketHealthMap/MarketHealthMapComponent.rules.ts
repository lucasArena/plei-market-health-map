"use client";

import type { MarketHealthView } from "@market-health-map/application";
import type { Messages } from "@market-health-map/i18n";
import type { GeoJSONSource, MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import {
	CIRCLE_LAYER_ID,
	CIRCLE_PAINT,
	DETAIL_PANEL_WIDTH,
	HEATMAP_LAYER_ID,
	HEATMAP_PAINT,
	MAP_CENTER,
	MAP_STYLE_URL,
	MAP_ZOOM,
	MARKETS_SOURCE_ID,
	selectedStrokeColor,
	selectedStrokeWidth,
} from "@/components/markets/MarketHealthMap/MarketHealthMapComponent.styles";
import type {
	MarketFeatureCollection,
	MarketFeatureProperties,
	MarketLegendItem,
	MarketMapStatus,
	MarketMetricKey,
	MarketMetricOption,
	MarketsInput,
} from "@/components/markets/MarketHealthMap/MarketHealthMapComponent.types";
import { HEALTH_STATUS_COLORS } from "@/components/markets/market-health-colors";
import { useMarketHealth } from "@/lib/api/use-market-health";

export const METRIC_KEYS: MarketMetricKey[] = [
	"healthScore",
	"activePlayers",
	"gamesLastWeek",
	"facilities",
];

export function toMarketFeatureCollection(
	markets: MarketHealthView[],
	metric: MarketMetricKey,
): MarketFeatureCollection {
	const peak = Math.max(1, ...markets.map((market) => market.metrics[metric]));
	return {
		type: "FeatureCollection",
		features: markets.map((market) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [market.location.longitude, market.location.latitude],
			},
			properties: {
				id: market.id,
				name: market.name,
				state: market.state,
				healthStatus: market.healthStatus,
				...market.metrics,
				weight: market.metrics[metric] / peak,
			},
		})),
	};
}

export function buildMetricOptions(messages: Messages["map"]): MarketMetricOption[] {
	return METRIC_KEYS.map((key) => ({ key, label: messages.metrics[key] }));
}

export function buildLegend(messages: Messages["map"]): MarketLegendItem[] {
	return [
		{ status: "healthy", label: messages.statuses.healthy, color: HEALTH_STATUS_COLORS.healthy },
		{ status: "watch", label: messages.statuses.watch, color: HEALTH_STATUS_COLORS.watch },
		{
			status: "at-risk",
			label: messages.statuses.atRisk,
			color: HEALTH_STATUS_COLORS["at-risk"],
		},
		{
			status: "inactive",
			label: messages.statuses.inactive,
			color: HEALTH_STATUS_COLORS.inactive,
		},
	];
}

export function resolveMapStatus(isPending: boolean, isError: boolean): MarketMapStatus {
	const status = { [`${!isPending}`]: "ready", [`${isError}`]: "error" }.true;
	return (status ?? "loading") as MarketMapStatus;
}

export function useMarketHealthMapRules() {
	const { messages } = useMessages();
	const query = useMarketHealth();
	const [metric, setMetric] = useState<MarketMetricKey>("healthScore");
	const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
	const [isMapReady, setIsMapReady] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const markets: MarketsInput = query.data;

	const mapMessages = messages.map;
	const metricOptions = useMemo(() => buildMetricOptions(mapMessages), [mapMessages]);
	const legend = useMemo(() => buildLegend(mapMessages), [mapMessages]);
	const featureCollection = useMemo(
		() => toMarketFeatureCollection(markets ?? [], metric),
		[markets, metric],
	);
	const status = resolveMapStatus(query.isPending, query.isError);

	const handleMarketClick = useCallback((event: MapLayerMouseEvent) => {
		const feature = event.features?.[0];
		if (!feature) return;
		const properties = feature.properties as MarketFeatureProperties;
		setSelectedMarketId(properties.id);
		mapRef.current?.easeTo({
			center: event.lngLat,
			padding: { top: 0, bottom: 0, left: 0, right: DETAIL_PANEL_WIDTH },
			duration: 600,
		});
	}, []);

	const closeDetail = useCallback(() => {
		setSelectedMarketId(null);
		mapRef.current?.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let isCancelled = false;
		let map: MapLibreMap | null = null;

		import("maplibre-gl").then(({ Map: MapLibre, NavigationControl }) => {
			if (isCancelled) return;
			map = new MapLibre({
				container,
				style: MAP_STYLE_URL,
				center: MAP_CENTER,
				zoom: MAP_ZOOM,
				attributionControl: { compact: true },
			});
			map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
			map.on("load", () => {
				map?.addSource(MARKETS_SOURCE_ID, {
					type: "geojson",
					data: { type: "FeatureCollection", features: [] },
				});
				map?.addLayer({
					id: HEATMAP_LAYER_ID,
					type: "heatmap",
					source: MARKETS_SOURCE_ID,
					paint: HEATMAP_PAINT,
				});
				map?.addLayer({
					id: CIRCLE_LAYER_ID,
					type: "circle",
					source: MARKETS_SOURCE_ID,
					paint: CIRCLE_PAINT,
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
		const source = map.getSource<GeoJSONSource>(MARKETS_SOURCE_ID);
		source?.setData(featureCollection);
	}, [featureCollection, isMapReady]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		map.setPaintProperty(
			CIRCLE_LAYER_ID,
			"circle-stroke-color",
			selectedStrokeColor(selectedMarketId),
		);
		map.setPaintProperty(
			CIRCLE_LAYER_ID,
			"circle-stroke-width",
			selectedStrokeWidth(selectedMarketId),
		);
	}, [selectedMarketId, isMapReady]);

	useEffect(() => {
		const map = mapRef.current;
		if (!isMapReady || !map) return;
		const showPointer = () => {
			map.getCanvas().style.cursor = "pointer";
		};
		const hidePointer = () => {
			map.getCanvas().style.cursor = "";
		};
		map.on("click", CIRCLE_LAYER_ID, handleMarketClick);
		map.on("mouseenter", CIRCLE_LAYER_ID, showPointer);
		map.on("mouseleave", CIRCLE_LAYER_ID, hidePointer);
		return () => {
			map.off("click", CIRCLE_LAYER_ID, handleMarketClick);
			map.off("mouseenter", CIRCLE_LAYER_ID, showPointer);
			map.off("mouseleave", CIRCLE_LAYER_ID, hidePointer);
		};
	}, [handleMarketClick, isMapReady]);

	return {
		closeDetail,
		containerRef,
		legend,
		messages: mapMessages,
		metric,
		metricOptions,
		selectedMarketId,
		setMetric,
		status,
	};
}
