"use client";

import type { GameDepartment } from "@market-health-map/core/domain";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { GameDepartmentFilterProps } from "@/presentation/components/map/GameDepartmentFilter/GameDepartmentFilterComponent.types";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const EMPTY_DEPARTMENTS: GameDepartment[] = [];

function departmentKey(departments: GameDepartment[]) {
	return [...departments].sort((left, right) => left.localeCompare(right)).join(",");
}

export function useGameDepartmentFilterRules(enabled: boolean) {
	const layers = useMapLayers();
	const { messages } = useMessages();
	const copy = messages.map;
	const filters = copy.sessionFilters;
	const applied = layers?.gameDepartments ?? EMPTY_DEPARTMENTS;
	const [draft, setDraft] = useState(applied);
	const [addOpen, setAddOpen] = useState(false);
	const [departmentOpen, setDepartmentOpen] = useState(false);
	const rootRef = useRef<HTMLElement>(null);
	const addRef = useRef<HTMLButtonElement>(null);
	const departmentRef = useRef<HTMLButtonElement>(null);
	const departmentGroupRef = useRef<HTMLFieldSetElement>(null);
	const options = [
		{ value: "magic" as GameDepartment, label: copy.gameDepartmentMagic },
		{ value: "organizers" as GameDepartment, label: copy.gameDepartmentOrganizers },
		{ value: "partnerships" as GameDepartment, label: copy.gameDepartmentPartnerships },
	];
	const appliedChips = options.filter((option) => applied.includes(option.value));
	const pending = departmentKey(draft) !== departmentKey(applied);
	const reportFields = layers?.setSupplyFiltersPresent;
	const hasFields = addOpen || departmentOpen || applied.length > 0 || draft.length > 0;

	const toggleAdd = () => {
		setAddOpen((current) => {
			if (current) setDepartmentOpen(false);
			return !current;
		});
	};

	const toggleDepartment = () => setDepartmentOpen((current) => !current);

	const isSelected = (department: GameDepartment) => draft.includes(department);

	const toggleOption = (department: GameDepartment) => {
		if (!enabled) return;
		setDraft((current) =>
			current.includes(department)
				? current.filter((value) => value !== department)
				: [...current, department],
		);
	};

	const removeDepartment = (department: GameDepartment) => {
		const next = applied.filter((value) => value !== department);
		setDraft(next);
		layers?.setGameDepartments?.(next);
	};

	const apply = () => {
		if (!pending) return;
		layers?.setGameDepartments?.(draft);
	};

	const handleKeys = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key === "Escape") {
			if (!addOpen) return;
			event.stopPropagation();
			event.preventDefault();
			const active = document.activeElement;
			if (
				departmentOpen &&
				(departmentGroupRef.current?.contains(active) || active === departmentRef.current)
			) {
				setDepartmentOpen(false);
				departmentRef.current?.focus();
				return;
			}
			setDepartmentOpen(false);
			setAddOpen(false);
			addRef.current?.focus();
			return;
		}
		const group = departmentGroupRef.current;
		if (
			!group?.contains(document.activeElement) ||
			!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
		)
			return;
		const inputs = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
		if (!inputs.length) return;
		event.preventDefault();
		const current = inputs.indexOf(document.activeElement as HTMLInputElement);
		const direction = event.key === "ArrowUp" ? -1 : 1;
		const next = {
			[`${true}`]: (current + direction + inputs.length) % inputs.length,
			[`${event.key === "Home"}`]: 0,
			[`${event.key === "End"}`]: inputs.length - 1,
		}.true;
		inputs[next ?? 0]?.focus();
	};

	useEffect(() => {
		reportFields?.(hasFields);
		return () => reportFields?.(false);
	}, [reportFields, hasFields]);

	useEffect(() => {
		setDraft(applied);
	}, [applied]);

	useEffect(() => {
		if (!enabled) {
			setAddOpen(false);
			setDepartmentOpen(false);
		}
	}, [enabled]);

	useEffect(() => {
		if (!departmentOpen) return;
		departmentGroupRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus();
	}, [departmentOpen]);

	return {
		copy,
		filters,
		rootRef,
		addOpen,
		addRef,
		departmentOpen,
		departmentRef,
		departmentGroupRef,
		draft,
		pending,
		options,
		appliedChips,
		enabled,
		toggleAdd,
		toggleDepartment,
		isSelected,
		toggleOption,
		removeDepartment,
		apply,
		handleKeys,
	};
}

export function useGameDepartmentFiltersRules(props: Readonly<GameDepartmentFilterProps>) {
	return useGameDepartmentFilterRules(props.enabled);
}
