"use client";

import type { GameDepartment } from "@market-health-map/core/domain";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function useGameDepartmentFilterRules(enabled: boolean) {
	const layers = useMapLayers();
	const { messages } = useMessages();
	const copy = messages.map;
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLFieldSetElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuId = useId();
	const selected = layers?.gameDepartments ?? [];
	const options = [
		{ value: "magic" as GameDepartment, label: copy.gameDepartmentMagic },
		{ value: "organizers" as GameDepartment, label: copy.gameDepartmentOrganizers },
		{ value: "partnerships" as GameDepartment, label: copy.gameDepartmentPartnerships },
	];
	const summary =
		options
			.filter((option) => selected.includes(option.value))
			.map((option) => option.label)
			.join(", ") || copy.gameDepartmentsAll;
	const toggleDepartment = (department: GameDepartment) =>
		layers?.setGameDepartments?.(
			selected.includes(department)
				? selected.filter((value) => value !== department)
				: [...selected, department],
		);
	const reset = () => layers?.setGameDepartments?.([]);
	const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key !== "Escape" || !isOpen) return;
		event.preventDefault();
		event.stopPropagation();
		setIsOpen(false);
		triggerRef.current?.focus();
	};
	useEffect(() => {
		if (!isOpen) return;
		rootRef.current?.querySelector<HTMLInputElement>("input")?.focus();
		const dismiss = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		document.addEventListener("pointerdown", dismiss);
		return () => document.removeEventListener("pointerdown", dismiss);
	}, [isOpen]);
	useEffect(() => {
		if (!enabled) setIsOpen(false);
	}, [enabled]);
	return {
		copy,
		isOpen,
		rootRef,
		triggerRef,
		menuId,
		selected,
		options,
		summary,
		toggleDepartment,
		reset,
		handleKeys,
		toggleMenu: () => setIsOpen((open) => !open),
	};
}
