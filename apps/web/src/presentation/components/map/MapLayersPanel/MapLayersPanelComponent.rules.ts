"use client";

import { formatMessage } from "@market-health-map/core/i18n";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { layersPanelPreference } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";

export const MAP_LAYER_COUNT = 3;

export function layersBadge(layersOn: number): string | null {
	return layersOn < MAP_LAYER_COUNT ? String(layersOn) : null;
}

export function useMapLayersPanelRules() {
	const { messages } = useMessages();
	const layers = useMapLayers();
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
	const layersOn = [showActiveFacilities, showInactiveFacilities, showSessions].filter(
		Boolean,
	).length;

	const expand = useCallback((next: boolean) => {
		layersPanelPreference.remember(next);
		setIsExpanded(next);
	}, []);
	const toggleExpanded = useCallback(() => expand(!isExpanded), [expand, isExpanded]);
	const closeOnEscape = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>) => {
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
		cardMotion: motion,
		closeOnEscape,
		finishCardMotion: finishReveal,
		isCardShown: isShown,
		isExpanded,
		isOnMap,
		layersBadge: layersBadge(layersOn),
		layersOnLabel: formatMessage(messages.map.layersOn, {
			count: String(layersOn),
			total: String(MAP_LAYER_COUNT),
		}),
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
