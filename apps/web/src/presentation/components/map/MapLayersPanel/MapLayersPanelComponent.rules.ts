"use client";

import { usePathname } from "next/navigation";
import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { layersPanelPreference } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import {
	isMapLayersCustomized,
	MAP_LAYERS_DEFAULTS,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.defaults";
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
	const [isDemandOpen, setIsDemandOpen] = useState(false);
	const demandRootRef = useRef<HTMLDivElement>(null);
	const demandTriggerRef = useRef<HTMLButtonElement>(null);
	const demandListId = useId();
	const closeDemand = () => {
		setIsDemandOpen(false);
		demandTriggerRef.current?.focus();
	};
	const toggleDemand = () => setIsDemandOpen((current) => !current);
	const demandKeys = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === "Escape" && isDemandOpen) {
			event.preventDefault();
			event.stopPropagation();
			closeDemand();
			return;
		}
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		event.preventDefault();
		event.stopPropagation();
		if (!isDemandOpen) {
			setIsDemandOpen(true);
			return;
		}
		const options = Array.from(
			demandRootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
		);
		const index = options.indexOf(document.activeElement as HTMLButtonElement);
		let next = (index + 1) % options.length;
		if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = options.length - 1;
		options[next]?.focus();
	};
	useEffect(() => {
		if (isDemandOpen)
			demandRootRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
	}, [isDemandOpen]);
	const isOnMap = usePathname() === "/";
	const [isExpanded, setIsExpanded] = useState(false);
	const { finishReveal, isShown, motion } = useRevealMotion(isExpanded);
	const rootRef = useRef<HTMLElement>(null);
	const [localShowActiveFacilities, setLocalShowActiveFacilities] = useState(
		MAP_LAYERS_DEFAULTS.showActiveFacilities,
	);
	const [localShowInactiveFacilities, setLocalShowInactiveFacilities] = useState(
		MAP_LAYERS_DEFAULTS.showInactiveFacilities,
	);
	const [localShowSessions, setLocalShowSessions] = useState(MAP_LAYERS_DEFAULTS.showSessions);
	const [resetCount, setResetCount] = useState(0);
	const showActiveFacilities = layers?.showActiveFacilities ?? localShowActiveFacilities;
	const showInactiveFacilities = layers?.showInactiveFacilities ?? localShowInactiveFacilities;
	const showSessions = layers?.showSessions ?? localShowSessions;
	const demandMetric = showDemographics ? (layers?.demandMetric ?? "sessions") : "sessions";
	const selectDemandMetric = (metric: "sessions" | "registrations") => {
		layers?.setDemandMetric?.(metric);
		closeDemand();
	};
	const isCustomized =
		demandMetric !== "sessions" ||
		isMapLayersCustomized({
			showActiveFacilities,
			showInactiveFacilities,
			showSessions,
			sessionFilters: layers?.sessionFilters ?? MAP_LAYERS_DEFAULTS.sessionFilters,
		});

	const expand = useCallback((next: boolean) => {
		if (!next) setIsDemandOpen(false);
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

	const resetLayers = useCallback(() => {
		setIsDemandOpen(false);
		layers?.resetLayers();
		setLocalShowActiveFacilities(MAP_LAYERS_DEFAULTS.showActiveFacilities);
		setLocalShowInactiveFacilities(MAP_LAYERS_DEFAULTS.showInactiveFacilities);
		setLocalShowSessions(MAP_LAYERS_DEFAULTS.showSessions);
		setResetCount((current) => current + 1);
		rootRef.current?.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus();
	}, [layers]);

	useEffect(() => {
		if (layersPanelPreference.isOpen()) setIsExpanded(true);
	}, []);

	useEffect(() => {
		const closeWhenOutside = (event: PointerEvent) => {
			if (!rootRef.current) return;
			if (!rootRef.current.contains(event.target as Node)) expand(false);
			if (!demandRootRef.current?.contains(event.target as Node)) setIsDemandOpen(false);
		};
		document.addEventListener("pointerdown", closeWhenOutside);
		return () => document.removeEventListener("pointerdown", closeWhenOutside);
	}, [expand]);

	return {
		isDemandOpen,
		demandRootRef,
		demandTriggerRef,
		demandListId,
		toggleDemand,
		demandKeys,
		demandMetric,
		selectDemandMetric,
		showDemographics,
		cardMotion: motion,
		closeOnEscape,
		finishCardMotion: finishReveal,
		isCardShown: isShown,
		isExpanded,
		isOnMap,
		isCustomized,
		messages: messages.map,
		resetCount,
		resetLayers,
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
