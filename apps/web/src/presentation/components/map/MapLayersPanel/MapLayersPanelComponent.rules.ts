"use client";

import { type AnimationEvent, useCallback, useEffect, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import type {
	LayersCardMotion,
	UserLayerFilter,
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
	const [isExpanded, setIsExpanded] = useState(true);
	const [cardMotion, setCardMotion] = useState<LayersCardMotion>("resting");
	const [localShowFacilities, setLocalShowFacilities] = useState(false);
	const [showUsers, setShowUsers] = useState(true);
	const [userFilter, setUserFilter] = useState<UserLayerFilter>("all");
	const showFacilities = layers?.showFacilities ?? localShowFacilities;

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
	const toggleUsers = useCallback(() => setShowUsers((current) => !current), []);
	const selectUserFilter = useCallback((filter: UserLayerFilter) => setUserFilter(filter), []);

	const copy = messages.map;
	const userFilters = [
		{ id: "all", label: copy.layersAll },
		{ id: "active-users", label: copy.layersActiveUsers },
		{ id: "active-players", label: copy.layersActivePlayers },
	] as const;

	const isCardShown = isExpanded || cardMotion === "exit";

	return {
		cardMotion,
		finishCardMotion,
		isCardShown,
		isExpanded,
		messages: copy,
		selectUserFilter,
		showFacilities,
		showUsers,
		toggleExpanded,
		toggleFacilities,
		toggleUsers,
		userFilter,
		userFilters,
	};
}
