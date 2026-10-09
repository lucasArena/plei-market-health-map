"use client";

import { usePathname } from "next/navigation";
import {
	type KeyboardEvent,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { layersPanelPreference } from "@/infrastructure/cache/local-storage/layers-panel/layers-panel-preference";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import {
	isMapLayersCustomized,
	MAP_LAYERS_DEFAULTS,
} from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.defaults";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";

function useRadiogroupKeys(rootRef: RefObject<HTMLElement | null>) {
	return (event: KeyboardEvent<HTMLElement>) => {
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		event.preventDefault();
		event.stopPropagation();
		const options = Array.from(
			rootRef.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [],
		);
		if (!options.length) return;
		const index = options.indexOf(document.activeElement as HTMLInputElement);
		let next = (index + 1) % options.length;
		if (event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = options.length - 1;
		options[next]?.focus();
		options[next]?.click();
	};
}

export function useMapLayersPanelRules() {
	const { messages } = useMessages();
	const layers = useMapLayers();
	const supplyMetric = layers?.supplyMetric ?? "games";
	const selectSupplyMetric = (value: string) =>
		layers?.setSupplyMetric?.(value === "games" ? "games" : "facilities");

	const demandGroupRef = useRef<HTMLDivElement>(null);
	const supplyGroupRef = useRef<HTMLDivElement>(null);
	const demandKeys = useRadiogroupKeys(demandGroupRef);
	const supplyKeys = useRadiogroupKeys(supplyGroupRef);

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
	const [localShowGamesTrend, setLocalShowGamesTrend] = useState(
		MAP_LAYERS_DEFAULTS.showGamesTrend,
	);
	const [localShowSessions, setLocalShowSessions] = useState(MAP_LAYERS_DEFAULTS.showSessions);
	const [resetCount, setResetCount] = useState(0);
	const showActiveFacilities = layers?.showActiveFacilities ?? localShowActiveFacilities;
	const showInactiveFacilities = layers?.showInactiveFacilities ?? localShowInactiveFacilities;
	const showSessions = layers?.showSessions ?? localShowSessions;
	const showGamesTrend = layers?.showGamesTrend ?? localShowGamesTrend;
	const demandMetric = layers?.demandMetric ?? "sessions";
	const selectDemandMetric = (value: string) => {
		layers?.setDemandMetric?.(value === "registrations" ? "registrations" : "sessions");
	};
	const isCustomized =
		Boolean(layers?.demandFiltersPresent || layers?.supplyFiltersPresent) ||
		demandMetric !== "sessions" ||
		supplyMetric !== "games" ||
		Boolean(layers?.gameDepartments?.length) ||
		isMapLayersCustomized({
			showActiveFacilities,
			showInactiveFacilities: supplyMetric === "games" ? false : showInactiveFacilities,
			showGamesTrend: supplyMetric === "games" ? showGamesTrend : false,
			showSessions,
			sessionFilters: layers?.sessionFilters ?? MAP_LAYERS_DEFAULTS.sessionFilters,
		});

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
	const toggleGamesTrend = useCallback(() => {
		if (layers?.setShowGamesTrend) {
			layers.setShowGamesTrend(!layers.showGamesTrend);
			return;
		}
		setLocalShowGamesTrend((current) => !current);
	}, [layers]);
	const toggleSessions = useCallback(() => {
		if (layers) {
			layers.setShowSessions(!layers.showSessions);
			return;
		}
		setLocalShowSessions((current) => !current);
	}, [layers]);

	const resetLayers = useCallback(() => {
		layers?.resetLayers();
		setLocalShowActiveFacilities(MAP_LAYERS_DEFAULTS.showActiveFacilities);
		setLocalShowInactiveFacilities(MAP_LAYERS_DEFAULTS.showInactiveFacilities);
		setLocalShowGamesTrend(MAP_LAYERS_DEFAULTS.showGamesTrend);
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
		};
		document.addEventListener("pointerdown", closeWhenOutside);
		return () => document.removeEventListener("pointerdown", closeWhenOutside);
	}, [expand]);

	return {
		demandGroupRef,
		demandKeys,
		demandMetric,
		selectDemandMetric,
		supplyGroupRef,
		supplyKeys,
		supplyMetric,
		selectSupplyMetric,
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
		showGamesTrend,
		showSessions,
		toggleExpanded,
		closePanel: () => expand(false),
		toggleActiveFacilities,
		toggleInactiveFacilities,
		toggleGamesTrend,
		toggleSessions,
	};
}
