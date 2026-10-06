"use client";

import type { AppSessionFilters } from "@market-health-map/core/application";
import { useEffect, useRef, useState } from "react";
import type {
	AgeBound,
	AgeText,
	FilterChoice,
	FilterKeyboardEvent,
	FilterSection,
	SelectedFilterChip,
	SessionFilterChipField,
	SessionFilterField,
} from "@/presentation/components/map/AppSessionFilters/AppSessionFiltersComponent.types";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useAppSessionFilterOptions } from "@/presentation/hooks/use-app/use-app-session-heatmap";

const EMPTY_FILTERS: AppSessionFilters = {};
const GENDER_IDS = ["female", "male", "other", "prefer not to say"] as const;
const SKILL_IDS = ["beginner", "intermediate", "advanced", "expert"] as const;
const SKILL_VALUES: Record<(typeof SKILL_IDS)[number], string> = {
	beginner: "Beginner",
	intermediate: "Intermediate",
	advanced: "Advanced",
	expert: "Expert",
};

export function useAppSessionFiltersRules(showSessions: boolean, onApplied?: () => void) {
	const layers = useMapLayers();
	const { messages } = useMessages();
	const copy = messages.map.sessionFilters;
	const applied = layers?.sessionFilters ?? EMPTY_FILTERS;
	const [draft, setDraft] = useState(applied);
	const [addOpen, setAddOpen] = useState(false);
	const [genderOpen, setGenderOpen] = useState(false);
	const [skillOpen, setSkillOpen] = useState(false);
	const [ageOpen, setAgeOpen] = useState(false);
	const [ageText, setAgeText] = useState<AgeText>({
		min: ageInput(applied.ageMin),
		max: ageInput(applied.ageMax),
	});
	const addRef = useRef<HTMLButtonElement>(null);
	const genderRef = useRef<HTMLButtonElement>(null);
	const skillRef = useRef<HTMLButtonElement>(null);
	const ageRef = useRef<HTMLButtonElement>(null);
	const genderGroupRef = useRef<HTMLFieldSetElement>(null);
	const skillGroupRef = useRef<HTMLFieldSetElement>(null);
	const ageGroupRef = useRef<HTMLDivElement>(null);
	const options = useAppSessionFilterOptions(showSessions);
	const genderLabels: Record<(typeof GENDER_IDS)[number], string> = {
		female: copy.female,
		male: copy.male,
		other: copy.other,
		"prefer not to say": copy.preferNotToSay,
	};
	const skillLabels: Record<(typeof SKILL_IDS)[number], string> = {
		beginner: copy.beginner,
		intermediate: copy.intermediate,
		advanced: copy.advanced,
		expert: copy.expert,
	};
	const genderOptions = choicesFor(GENDER_IDS, genderLabels, options.data?.genders);
	const skillOptions = choicesFor(SKILL_IDS, skillLabels, options.data?.skills, SKILL_VALUES);
	const appliedGenders = profileValues(applied.gender);
	const appliedSkills = profileValues(applied.skill);
	const selected: SelectedFilterChip[] = [
		...matched(genderOptions, appliedGenders).map((option) => ({
			field: "gender" as const,
			...option,
		})),
		...matched(skillOptions, appliedSkills).map((option) => ({
			field: "skill" as const,
			...option,
		})),
	];
	const ageLabel = ageRangeLabel(applied.ageMin, applied.ageMax);
	if (ageLabel) selected.push({ field: "age", id: "age", label: ageLabel });
	const parsedAge = parseAgeRange(ageText);
	const sections: FilterSection[] = [
		{
			id: "gender",
			label: copy.gender,
			open: genderOpen,
			toggle: () => setGenderOpen((current) => !current),
			buttonRef: genderRef,
			groupRef: genderGroupRef,
			options: genderOptions,
		},
		{
			id: "skill",
			label: copy.skill,
			open: skillOpen,
			toggle: () => setSkillOpen((current) => !current),
			buttonRef: skillRef,
			groupRef: skillGroupRef,
			options: skillOptions,
		},
	];

	useEffect(() => {
		setDraft(applied);
		setAgeText({ min: ageInput(applied.ageMin), max: ageInput(applied.ageMax) });
	}, [applied]);

	useEffect(() => {
		if (showSessions) return;
		setAddOpen(false);
		setGenderOpen(false);
		setSkillOpen(false);
		setAgeOpen(false);
	}, [showSessions]);

	useEffect(() => {
		if (!genderOpen) return;
		genderGroupRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus();
	}, [genderOpen]);

	useEffect(() => {
		if (!skillOpen) return;
		skillGroupRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus();
	}, [skillOpen]);

	useEffect(() => {
		if (!ageOpen) return;
		ageGroupRef.current?.querySelector<HTMLInputElement>("input")?.focus();
	}, [ageOpen]);

	const pending = hasSelection(draft) && selectionKey(draft) !== selectionKey(applied);
	const reportFields = layers?.setDemandFiltersPresent;
	const hasFields = hasSelection(draft) || hasSelection(applied);
	useEffect(() => {
		reportFields?.(hasFields);
		return () => reportFields?.(false);
	}, [reportFields, hasFields]);

	function toggleAdd() {
		setAddOpen((current) => {
			if (current) {
				setGenderOpen(false);
				setSkillOpen(false);
				setAgeOpen(false);
			}
			return !current;
		});
	}

	function replaceField(source: AppSessionFilters, field: SessionFilterField, next: string[]) {
		const filters: AppSessionFilters = { ...source };
		if (next.length) filters[field] = next;
		else delete filters[field];
		return filters;
	}

	function toggleOption(field: SessionFilterField, id: string) {
		if (!showSessions) return;
		const list = field === "gender" ? genderOptions : skillOptions;
		const current = profileValues(draft[field]);
		const option = list.find((item) => item.id === id);
		if (!option) return;
		const exists = current.some((value) => value.toLowerCase() === id);
		const next = exists
			? current.filter((value) => value.toLowerCase() !== id)
			: [...current, option.value].sort((left, right) => left.localeCompare(right));
		setDraft(replaceField(draft, field, next));
	}

	function removeOption(field: SessionFilterChipField, id: string) {
		if (field === "age") {
			const filters: AppSessionFilters = { ...applied };
			delete filters.ageMin;
			delete filters.ageMax;
			setDraft(filters);
			setAgeText({ min: "", max: "" });
			layers?.setSessionFilters(filters);
			return;
		}
		const next = profileValues(applied[field]).filter((value) => value.toLowerCase() !== id);
		const filters = replaceField(applied, field, next);
		setDraft(filters);
		layers?.setSessionFilters(filters);
	}

	function changeAge(bound: AgeBound, value: string) {
		const nextText = { ...ageText, [bound]: value };
		setAgeText(nextText);
		const parsed = parseAgeRange(nextText);
		if (!parsed.valid) return;
		const filters: AppSessionFilters = { ...draft };
		if (parsed.min === undefined) delete filters.ageMin;
		else filters.ageMin = parsed.min;
		if (parsed.max === undefined) delete filters.ageMax;
		else filters.ageMax = parsed.max;
		setDraft(filters);
	}

	function stepAge(bound: AgeBound, direction: 1 | -1) {
		const parsed = parseAgeBound(ageText[bound]);
		if (!parsed.ok) return;
		if (parsed.age === undefined && direction === -1) return;
		const next = (parsed.age ?? -1) + direction;
		if (next < 0 || next > 120) return;
		changeAge(bound, String(next));
	}

	function applyFilters() {
		if (!pending) return;
		layers?.setSessionFilters(draft);
		onApplied?.();
	}

	function handleKeys(event: FilterKeyboardEvent) {
		if (event.key === "Escape") {
			if (!addOpen) return;
			event.stopPropagation();
			event.preventDefault();
			const active = document.activeElement;
			if (ageOpen && (ageGroupRef.current?.contains(active) || active === ageRef.current)) {
				setAgeOpen(false);
				ageRef.current?.focus();
				return;
			}
			if (skillOpen && (skillGroupRef.current?.contains(active) || active === skillRef.current)) {
				setSkillOpen(false);
				skillRef.current?.focus();
				return;
			}
			if (
				genderOpen &&
				(genderGroupRef.current?.contains(active) || active === genderRef.current)
			) {
				setGenderOpen(false);
				genderRef.current?.focus();
				return;
			}
			setGenderOpen(false);
			setSkillOpen(false);
			setAgeOpen(false);
			setAddOpen(false);
			addRef.current?.focus();
			return;
		}
		const group = [genderGroupRef, skillGroupRef].find((ref) =>
			ref.current?.contains(document.activeElement),
		)?.current;
		if (!group || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		const buttons = Array.from(
			group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not(:disabled)'),
		);
		if (!buttons.length) return;
		event.preventDefault();
		const current = buttons.indexOf(document.activeElement as HTMLInputElement);
		const direction = event.key === "ArrowUp" ? -1 : 1;
		const next = {
			[`${true}`]: (current + direction + buttons.length) % buttons.length,
			[`${event.key === "Home"}`]: 0,
			[`${event.key === "End"}`]: buttons.length - 1,
		}.true;
		buttons[next ?? 0]?.focus();
	}

	return {
		copy,
		showSessions,
		addOpen,
		addRef,
		sections,
		selected,
		toggleAdd,
		toggleOption,
		removeOption,
		applyFilters,
		pending: parsedAge.valid && pending,
		handleKeys,
		isSelected: (field: SessionFilterField, id: string) =>
			profileValues(draft[field]).some((value) => value.toLowerCase() === id),
		ageOpen,
		toggleAge: () => setAgeOpen((current) => !current),
		ageRef,
		ageGroupRef,
		ageText,
		changeAge,
		stepAge,
		ageError: parsedAge.valid ? "" : copy.invalidAge,
	};
}

function choicesFor(
	ids: readonly string[],
	labels: Record<string, string>,
	warehouse: string[] | undefined,
	fallback: Record<string, string> = {},
): FilterChoice[] {
	return ids.map((id) => ({
		id,
		label: labels[id] ?? id,
		value: warehouse?.find((item) => item.toLowerCase() === id) ?? fallback[id] ?? id,
	}));
}

function matched(options: FilterChoice[], applied: string[]): FilterChoice[] {
	return options.filter((option) => applied.some((value) => value.toLowerCase() === option.id));
}

function profileValues(value: string | string[] | undefined): string[] {
	if (value === undefined) return [];
	if (Array.isArray(value)) return value;
	return [value];
}

function hasSelection(filters: AppSessionFilters) {
	return (
		profileValues(filters.gender).length + profileValues(filters.skill).length > 0 ||
		filters.ageMin !== undefined ||
		filters.ageMax !== undefined
	);
}

function selectionKey(filters: AppSessionFilters) {
	const fields = (["gender", "skill"] as const)
		.map((field) =>
			profileValues(filters[field])
				.map((value) => value.toLowerCase())
				.sort((left, right) => left.localeCompare(right))
				.join(","),
		)
		.join(";");
	return `${fields};${filters.ageMin ?? ""}:${filters.ageMax ?? ""}`;
}

function ageInput(value: number | undefined) {
	return value === undefined ? "" : String(value);
}

function ageRangeLabel(min: number | undefined, max: number | undefined) {
	if (min === undefined && max === undefined) return "";
	return {
		[`${true}`]: `${min}–${max}`,
		[`${min === undefined}`]: `≤ ${max}`,
		[`${max === undefined}`]: `${min}+`,
		[`${min === max}`]: String(min),
	}.true;
}

function parseAgeRange(text: AgeText) {
	const min = parseAgeBound(text.min);
	const max = parseAgeBound(text.max);
	const ordered =
		min.ok && max.ok && (min.age === undefined || max.age === undefined || min.age <= max.age);
	return {
		valid: min.ok && max.ok && ordered,
		min: min.age,
		max: max.age,
	};
}

function parseAgeBound(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return { ok: true as const };
	if (!/^\d+$/.test(trimmed)) return { ok: false as const };
	const age = Number(trimmed);
	if (age > 120) return { ok: false as const };
	return { ok: true as const, age };
}
