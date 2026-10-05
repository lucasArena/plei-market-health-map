"use client";

import type { AppSessionFilters } from "@market-health-map/core/application";
import { useEffect, useRef, useState } from "react";
import type {
	FilterKeyboardEvent,
	SessionFilterField,
	SessionFilterMenu,
} from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.types";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	useAppSessionFilterOptions,
	useAppSessionHeatmap,
} from "@/presentation/hooks/use-app/use-app-session-heatmap";

export function useAppSessionFiltersRules(showSessions: boolean) {
	const layers = useMapLayers();
	const { messages } = useMessages();
	const { period } = useMapScope();
	const copy = messages.map.sessionFilters;
	const applied = layers?.sessionFilters ?? {};
	const [draft, setDraft] = useState<AppSessionFilters>(applied);
	const [fields, setFields] = useState<SessionFilterField[]>(() => {
		const initial: SessionFilterField[] = [];
		if (applied.gender) initial.push("gender");
		if (applied.skill) initial.push("skill");
		if (applied.ageMin !== undefined || applied.ageMax !== undefined) initial.push("age");
		return initial;
	});
	const [menu, setMenu] = useState<SessionFilterMenu>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const options = useAppSessionFilterOptions(
		showSessions && (menu === "gender" || menu === "skill"),
	);
	useEffect(() => {
		if (!menu) return;
		const selector =
			menu === "age"
				? "input"
				: menu === "add" || options.data
					? '[role="option"]'
					: "button:not(:disabled)";
		const selected = menuRef.current?.querySelector<HTMLButtonElement>(
			'[role="option"][aria-selected="true"]',
		);
		(selected ?? menuRef.current?.querySelector<HTMLButtonElement>(selector))?.focus();
	}, [menu, options.data]);
	useEffect(() => {
		if (!showSessions) setMenu(null);
	}, [showSessions]);
	const sessions = useAppSessionHeatmap(applied, period, showSessions);
	function ageLabel(filters: AppSessionFilters) {
		if (filters.ageMin !== undefined && filters.ageMax !== undefined)
			return `${filters.ageMin}–${filters.ageMax}`;
		if (filters.ageMin !== undefined) return `${filters.ageMin}+`;
		if (filters.ageMax !== undefined) return `≤ ${filters.ageMax}`;
		return undefined;
	}
	const summary = [
		profileValues(applied.gender).map(genderLabel).join(", "),
		profileValues(applied.skill).join(", "),
		ageLabel(applied),
	]
		.filter(Boolean)
		.join(" · ");
	const invalidAge =
		(draft.ageMin !== undefined &&
			(!Number.isInteger(draft.ageMin) || draft.ageMin < 0 || draft.ageMin > 120)) ||
		(draft.ageMax !== undefined &&
			(!Number.isInteger(draft.ageMax) || draft.ageMax < 0 || draft.ageMax > 120)) ||
		(draft.ageMin !== undefined && draft.ageMax !== undefined && draft.ageMin > draft.ageMax);
	function setAgeBound(field: "ageMin" | "ageMax", value: string) {
		setDraft((current) => ({ ...current, [field]: value === "" ? undefined : Number(value) }));
	}
	const hasFilters = Boolean(summary);
	function genderLabel(value: string) {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
	function profileValues(value: string | string[] | undefined): string[] {
		return value === undefined ? [] : Array.isArray(value) ? value : [value];
	}
	const dirty = ["gender", "skill", "ageMin", "ageMax"].some(
		(key) =>
			JSON.stringify(draft[key as keyof AppSessionFilters]) !==
			JSON.stringify(applied[key as keyof AppSessionFilters]),
	);
	function setField(field: "gender" | "skill", value: string) {
		setDraft((current) => {
			const selected = profileValues(current[field]);
			const next =
				value === ""
					? []
					: selected.includes(value)
						? selected.filter((item) => item !== value)
						: [...selected, value].sort();
			return { ...current, [field]: next.length ? next : undefined };
		});
	}
	function apply() {
		if (invalidAge) return;
		layers?.setSessionFilters(
			Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== undefined)),
		);
	}
	function reset() {
		setFields([]);
		setMenu(null);
		setDraft({});
		layers?.setSessionFilters({});
	}
	const fieldLabels = { gender: copy.gender, skill: copy.skill, age: copy.age };
	const availableFields = (["gender", "skill", "age"] as const).filter(
		(field) => !fields.includes(field),
	);
	const values = {
		gender: profileValues(draft.gender),
		skill: profileValues(draft.skill),
		age: "",
	};
	const fieldValues = {
		gender: profileValues(draft.gender).map(genderLabel).join(", "),
		skill: profileValues(draft.skill).join(", "),
		age: ageLabel(draft),
	};
	const choices = {
		add: availableFields.map((field) => ({ value: field, label: fieldLabels[field] })),
		gender: [
			{ value: "", label: copy.allGenders },
			...(options.data?.genders ?? []).map((value) => ({ value, label: genderLabel(value) })),
		],
		skill: [
			{ value: "", label: copy.allSkills },
			...[...(options.data?.skills ?? [])]
				.sort((a, b) => {
					const order = ["Beginner", "Intermediate", "Advanced", "Expert"];
					const rank = (value: string) => {
						const index = order.indexOf(value);
						return index < 0 ? order.length : index;
					};
					return rank(a) - rank(b) || a.localeCompare(b);
				})
				.map((value) => ({ value, label: value })),
		],
		age: [],
	};
	function openMenu(next: SessionFilterMenu, trigger: HTMLButtonElement) {
		triggerRef.current = trigger;
		setMenu((current) => (current === next ? null : next));
	}
	function closeMenu() {
		setMenu(null);
		triggerRef.current?.focus();
	}
	function selectChoice(value: string) {
		if (menu === "add") {
			const field = value as SessionFilterField;
			setFields((current) => [...current, field]);
			setMenu(field);
			return;
		}

		if (menu === "gender" || menu === "skill") {
			setField(menu, value);
			return;
		}
		closeMenu();
	}
	function removeField(field: SessionFilterField) {
		setFields((current) => current.filter((item) => item !== field));
		if (field === "age")
			setDraft((current) => ({ ...current, ageMin: undefined, ageMax: undefined }));
		if (field === "gender" || field === "skill") setField(field, "");
		if (menu === field) setMenu(null);
	}
	function handleKeys(event: FilterKeyboardEvent) {
		if (!menu) return;
		if (event.key === "Escape") {
			event.stopPropagation();
			event.preventDefault();
			closeMenu();
			return;
		}
		if ((event.target as HTMLElement).tagName === "INPUT") return;
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		const buttons = Array.from(
			menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? [],
		);
		if (!buttons.length) return;
		event.preventDefault();
		const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
		const direction = event.key === "ArrowUp" ? -1 : 1;
		const next = {
			[`${true}`]: (current + direction + buttons.length) % buttons.length,
			[`${event.key === "Home"}`]: 0,
			[`${event.key === "End"}`]: buttons.length - 1,
		}.true;
		buttons[next ?? 0]?.focus();
	}

	const status =
		{
			[`${sessions.isSuccess && sessions.data.length === 0}`]: copy.empty,
			[`${sessions.isError}`]: copy.sessionsError,
			[`${sessions.isFetching}`]: copy.updating,
		}.true ?? "";
	return {
		invalidAge,
		setAgeBound,
		menu,
		menuRef,
		fields,
		fieldLabels,
		fieldValues,
		availableFields,
		isSelected: (value: string) =>
			menu === "gender" || menu === "skill"
				? value === ""
					? values[menu].length === 0
					: values[menu].includes(value)
				: false,
		values,
		choices,
		openMenu,
		closeMenu,
		selectChoice,
		removeField,
		handleKeys,
		copy,
		draft,
		options,
		sessions,

		summary,
		hasFilters,
		dirty,
		setField,

		apply,
		reset,
		status,
	};
}
