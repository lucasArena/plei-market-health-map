"use client";

import { usePathname } from "next/navigation";
import { type AnimationEvent, useCallback, useEffect, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import type {
	DemandHeatmapMetric,
	LayersCardMotion,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const LAYERS_CARD_MOTION_MS = {
	resting: 0,
	enter: 200,
	exit: 160,
} as const;

export function useMapLayersPanelRules() {
	const { messages } = useMessages();
	const layers = useMapLayers();
	const isOnMap = usePathname() === "/";
	const [isExpanded, setIsExpanded] = useState(true);
	const [cardMotion, setCardMotion] = useState<LayersCardMotion>("resting");
	const [localShowFacilities, setLocalShowFacilities] = useState(true);
	const [localDemandMetric, setLocalDemandMetric] = useState<DemandHeatmapMetric>("app-sessions");
	const showFacilities = layers?.showFacilities ?? localShowFacilities;
	const demandMetric = layers?.demandMetric ?? localDemandMetric;

	const toggleExpanded = useCallback(() => {
		setCardMotion(isExpanded ? "exit" : "enter");
		setIsExpanded((current) => !current);
	}, [isExpanded]);
	const finishCardMotion = useCallback((event: AnimationEvent<HTMLDivElement>) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const finished = {
			[`${target.classList.contains("layers-card-out")}`]: true,
			[`${target.classList.contains("layers-card-in")}`]: true,
		}.true;
		if (!finished) return;
		setCardMotion("resting");
	}, []);
	useEffect(() => {
		if (cardMotion === "resting") return;
		const timer = window.setTimeout(
			() => setCardMotion("resting"),
			LAYERS_CARD_MOTION_MS[cardMotion],
		);
		return () => window.clearTimeout(timer);
	}, [cardMotion]);
	const toggleFacilities = useCallback(() => {
		if (layers) {
			layers.setShowFacilities(!layers.showFacilities);
			return;
		}
		setLocalShowFacilities((current) => !current);
	}, [layers]);
	const selectDemandMetric = useCallback(
		(metric: DemandHeatmapMetric) => {
			if (layers) {
				layers.setDemandMetric(metric);
				return;
			}
			setLocalDemandMetric(metric);
		},
		[layers],
	);
	const isCardShown = isExpanded || cardMotion === "exit";

	return {
		isOnMap,
		cardMotion,
		finishCardMotion,
		isCardShown,
		isExpanded,
		messages: messages.map,
		showFacilities,
		demandMetric,
		selectDemandMetric,
		toggleExpanded,
		toggleFacilities,
	};
}
