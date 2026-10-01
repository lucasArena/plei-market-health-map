"use client";

import { usePathname } from "next/navigation";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import type { DemandHeatmapMetric } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";

export function useMapLayersPanelRules() {
	const { messages } = useMessages();
	const layers = useMapLayers();
	const isOnMap = usePathname() === "/";
	const [isExpanded, setIsExpanded] = useState(true);
	const { finishReveal, isShown, motion } = useRevealMotion(isExpanded);
	const rootRef = useRef<HTMLElement>(null);
	const [localShowActiveFacilities, setLocalShowActiveFacilities] = useState(true);
	const [localShowInactiveFacilities, setLocalShowInactiveFacilities] = useState(true);
	const [localDemandMetric, setLocalDemandMetric] = useState<DemandHeatmapMetric>("app-sessions");
	const showActiveFacilities = layers?.showActiveFacilities ?? localShowActiveFacilities;
	const showInactiveFacilities = layers?.showInactiveFacilities ?? localShowInactiveFacilities;
	const demandMetric = layers?.demandMetric ?? localDemandMetric;

	useEffect(() => {
		const closeWhenOutside = (event: PointerEvent) => {
			if (!rootRef.current) return;
			if (!rootRef.current.contains(event.target as Node)) setIsExpanded(false);
		};
		document.addEventListener("pointerdown", closeWhenOutside);
		return () => document.removeEventListener("pointerdown", closeWhenOutside);
	}, []);

	const toggleExpanded = useCallback(() => {
		setIsExpanded((current) => !current);
	}, []);
	const closeOnEscape = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === "Escape") setIsExpanded(false);
	}, []);
	const toggleActiveFacilities = useCallback(() => {
		if (layers) {
			layers.setShowActiveFacilities(!layers.showActiveFacilities);
			return;
		}
		setLocalShowActiveFacilities((current) => !current);
	}, [layers]);
	const toggleInactiveFacilities = useCallback(() => {
		if (layers) {
			layers.setShowInactiveFacilities(!layers.showInactiveFacilities);
			return;
		}
		setLocalShowInactiveFacilities((current) => !current);
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

	return {
		cardMotion: motion,
		closeOnEscape,
		finishCardMotion: finishReveal,
		isCardShown: isShown,
		isExpanded,
		isOnMap,
		messages: messages.map,
		rootRef,
		demandMetric,
		selectDemandMetric,
		showActiveFacilities,
		showInactiveFacilities,
		toggleExpanded,
		toggleActiveFacilities,
		toggleInactiveFacilities,
	};
}
