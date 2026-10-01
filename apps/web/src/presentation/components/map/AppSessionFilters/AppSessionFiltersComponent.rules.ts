"use client";

import type { AppSessionFilters } from "@market-health-map/core/application";
import { useState } from "react";
import { useMapLayers } from "@/presentation/components/map/MapLayersPanel/MapLayersPanelComponent.context";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import {
	useAppSessionFilterOptions,
	useAppSessionHeatmap,
} from "@/presentation/hooks/use-app/use-app-session-heatmap";

export function useAppSessionFiltersRules(showSessions: boolean) {
	const layers = useMapLayers();
	const { messages } = useMessages();
	const copy = messages.map.sessionFilters;
	const applied = layers?.sessionFilters ?? {};
	const [draft, setDraft] = useState<AppSessionFilters>(applied);
	const options = useAppSessionFilterOptions(showSessions);
	const sessions = useAppSessionHeatmap(applied, showSessions);
	const ageRanges = [
		{ key: "all", label: copy.allAges, min: undefined, max: undefined },
		{ key: "under18", label: copy.under18, min: 0, max: 17 },
		{ key: "18", label: copy.age18, min: 18, max: 24 },
		{ key: "25", label: copy.age25, min: 25, max: 34 },
		{ key: "35", label: copy.age35, min: 35, max: 44 },
		{ key: "45", label: copy.age45, min: 45, max: undefined },
	];
	const ageKey =
		ageRanges.find((age) => age.min === draft.ageMin && age.max === draft.ageMax)?.key ?? "all";
	const summary = [
		applied.gender,
		applied.skill,
		ageRanges.find(
			(age) => age.min === applied.ageMin && age.max === applied.ageMax && age.key !== "all",
		)?.label,
	]
		.filter(Boolean)
		.join(" · ");
	const hasFilters = Boolean(summary);
	const dirty = ["gender", "skill", "ageMin", "ageMax"].some(
		(key) => draft[key as keyof AppSessionFilters] !== applied[key as keyof AppSessionFilters],
	);
	function setField(field: "gender" | "skill", value: string) {
		setDraft((current) => ({ ...current, [field]: value || undefined }));
	}
	function setAge(key: string) {
		const age = ageRanges.find((range) => range.key === key);
		setDraft((current) => ({ ...current, ageMin: age?.min, ageMax: age?.max }));
	}
	function apply() {
		layers?.setSessionFilters(
			Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== undefined)),
		);
	}
	function reset() {
		setDraft({});
		layers?.setSessionFilters({});
	}
	const status =
		{
			[`${sessions.isSuccess && sessions.data.length === 0}`]: copy.empty,
			[`${sessions.isError}`]: copy.sessionsError,
			[`${sessions.isFetching}`]: copy.updating,
		}.true ?? "";
	return {
		copy,
		draft,
		options,
		sessions,
		ageRanges,
		ageKey,
		summary,
		hasFilters,
		dirty,
		setField,
		setAge,
		apply,
		reset,
		status,
	};
}
