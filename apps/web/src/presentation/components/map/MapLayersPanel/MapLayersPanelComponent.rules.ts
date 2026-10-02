"use client";

import { usePathname } from "next/navigation";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { layersPanelPreference } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";

export function useMapLayersPanelRules() {
	const { messages } = useMessages();
	const layers = useMapLayers();
	const showDemographics = useFeatureFlag("player-demographic-filters");
	const setSessionFilters = layers?.setSessionFilters;
	useEffect(() => {
		if (!showDemographics) setSessionFilters?.({});
	}, [showDemographics, setSessionFilters]);
	const isOnMap = usePathname() === "/";
	const [isExpanded, setIsExpanded] = useState(false);
	const { finishReveal, isShown, motion } = useRevealMotion(isExpanded);
	const rootRef = useRef<HTMLElement>(null);
	const [localShowActiveFacilities, setLocalShowActiveFacilities] = useState(true);
	const [localShowInactiveFacilities, setLocalShowInactiveFacilities] = useState(true);
	const [localShowSessions, setLocalShowSessions] = useState(true);
	const showActiveFacilities = layers?.showActiveFacilities ?? localShowActiveFacilities;
	const showInactiveFacilities = layers?.showInactiveFacilities ?? localShowInactiveFacilities;
	const showSessions = layers?.showSessions ?? localShowSessions;
	const hasSessionFilters = Object.values(layers?.sessionFilters ?? {}).some(
		(value) => value !== undefined,
	);
	const isCustomized =
		!showActiveFacilities || !showInactiveFacilities || !showSessions || hasSessionFilters;

	const expand = useCallback((next: boolean) => {
		layersPanelPreference.remember(next);
		setIsExpanded(next);
	}, []);
	const toggleExpanded = useCallback(() => expand(!isExpanded), [expand, isExpanded]);
	const closeOnEscape = useCallback(
		(event: KeyboardEvent<HTMLElement>) => {
			if (event.key === "Escape") expand(false);
		},
		[expand],
	);
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

	useEffect(() => {
		if (layersPanelPreference.isOpen()) setIsExpanded(true);
	}, []);

	useEffect(() => {
		const closeWhenOutside = (event: PointerEvent) => {
			if (!rootRef.current) return;
			if (!rootRef.current.contains(event.target as Node)) expand(false);
		};
		document.addEventListener("pointerdown", closeWhenOutside);
		return () => document.removeEventListener("pointerdown", closeWhenOutside);
	}, [expand]);

	return {
		showDemographics,
		cardMotion: motion,
		closeOnEscape,
		finishCardMotion: finishReveal,
		isCardShown: isShown,
		isExpanded,
		isOnMap,
		isCustomized,
		messages: messages.map,
		rootRef,
		showActiveFacilities,
		showInactiveFacilities,
		showSessions,
		toggleExpanded,
		toggleActiveFacilities,
		toggleInactiveFacilities,
		toggleSessions,
	};
}
