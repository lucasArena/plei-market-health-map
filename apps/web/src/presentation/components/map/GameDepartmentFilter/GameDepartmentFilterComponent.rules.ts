"use client";

import type { GameDepartment } from "@market-health-map/core/domain";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { GameDepartmentMenu } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.types";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const EMPTY_DEPARTMENTS: GameDepartment[] = [];
export function useGameDepartmentFilterRules(enabled: boolean) {
	const layers = useMapLayers();
	const { messages } = useMessages();
	const copy = messages.map;
	const applied = layers?.gameDepartments ?? EMPTY_DEPARTMENTS;
	const [draft, setDraft] = useState(applied);
	const [hasField, setHasField] = useState(applied.length > 0);
	const [menu, setMenu] = useState<GameDepartmentMenu>(null);
	const rootRef = useRef<HTMLElement>(null);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const options = [
		{ value: "magic" as GameDepartment, label: copy.gameDepartmentMagic },
		{ value: "organizers" as GameDepartment, label: copy.gameDepartmentOrganizers },
		{ value: "partnerships" as GameDepartment, label: copy.gameDepartmentPartnerships },
	];
	const labels = (departments: GameDepartment[]) =>
		options
			.filter((option) => departments.includes(option.value))
			.map((option) => option.label)
			.join(", ");
	const summary = labels(applied);
	const draftSummary = labels(draft);
	const dirty = options.some(
		(option) => applied.includes(option.value) !== draft.includes(option.value),
	);
	const openMenu = (next: GameDepartmentMenu, trigger: HTMLButtonElement) => {
		triggerRef.current = trigger;
		setMenu(next);
	};
	const closeMenu = () => {
		setMenu(null);
		triggerRef.current?.focus();
	};
	const addDepartment = () => {
		setHasField(true);
		setMenu("department");
	};
	const toggleDepartment = (department: GameDepartment) =>
		setDraft((current) =>
			current.includes(department)
				? current.filter((value) => value !== department)
				: [...current, department],
		);
	const reset = () => {
		setDraft([]);
		setHasField(false);
		layers?.setGameDepartments?.([]);
		closeMenu();
	};
	const apply = () => {
		layers?.setGameDepartments?.(draft);
		closeMenu();
	};
	const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
		if (!menu) return;
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			closeMenu();
			return;
		}
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		event.preventDefault();
		event.stopPropagation();
		const buttons = Array.from(
			rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
		);
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		let next = (index + 1) % buttons.length;
		if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = buttons.length - 1;
		buttons[next]?.focus();
	};
	const reportFields = layers?.setSupplyFiltersPresent;
	const hasFields = hasField;
	useEffect(() => {
		reportFields?.(hasFields);
		return () => reportFields?.(false);
	}, [reportFields, hasFields]);

	useEffect(() => {
		setDraft(applied);
		if (applied.length) setHasField(true);
	}, [applied]);
	useEffect(() => {
		if (!menu) return;
		if (menu === "department")
			triggerRef.current =
				rootRef.current?.querySelector<HTMLButtonElement>(
					'button[aria-label][aria-haspopup="listbox"]',
				) ?? null;
		rootRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
		const dismiss = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setMenu(null);
		};
		document.addEventListener("pointerdown", dismiss);
		return () => document.removeEventListener("pointerdown", dismiss);
	}, [menu]);
	useEffect(() => {
		if (!enabled) setMenu(null);
	}, [enabled]);
	return {
		copy,
		menu,
		rootRef,
		draft,
		hasField,
		dirty,
		options,
		summary,
		draftSummary,
		openMenu,
		closeMenu,
		addDepartment,
		toggleDepartment,
		reset,
		apply,
		handleKeys,
	};
}
