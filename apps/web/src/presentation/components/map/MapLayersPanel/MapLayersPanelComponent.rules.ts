"use client";

import { usePathname } from "next/navigation";
import { type AnimationEvent, useCallback, useEffect, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import type { LayersCardMotion } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.types";
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
	const [localShowActiveFacilities, setLocalShowActiveFacilities] = useState(true);
	const [localShowInactiveFacilities, setLocalShowInactiveFacilities] = useState(true);
	const [localShowSessions, setLocalShowSessions] = useState(true);
	const showActiveFacilities = layers?.showActiveFacilities ?? localShowActiveFacilities;
	const showInactiveFacilities = layers?.showInactiveFacilities ?? localShowInactiveFacilities;
	const showSessions = layers?.showSessions ?? localShowSessions;

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
	const toggleSessions = useCallback(() => {
		if (layers) {
			layers.setShowSessions(!layers.showSessions);
			return;
		}
		setLocalShowSessions((current) => !current);
	}, [layers]);
	const isCardShown = isExpanded || cardMotion === "exit";

	return {
		isOnMap,
		cardMotion,
		finishCardMotion,
		isCardShown,
		isExpanded,
		messages: messages.map,
		showActiveFacilities,
		showInactiveFacilities,
		showSessions,
		toggleExpanded,
		toggleActiveFacilities,
		toggleInactiveFacilities,
		toggleSessions,
	};
}
