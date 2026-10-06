"use client";

import { STATS_PERIODS, type StatsPeriod } from "@market-health-map/core/application";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
	PeriodSwitchOption,
	PeriodThumbStyle,
} from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const HIDDEN_THUMB: PeriodThumbStyle = { left: 0, width: 0, ready: false };

export function usePeriodSwitchRules() {
	const { messages } = useMessages();
	const { period, setPeriod } = useMapScope();
	const isOnMap = usePathname() === "/";
	const trackRef = useRef<HTMLFieldSetElement>(null);
	const optionRefs = useRef(new Map<StatsPeriod, HTMLButtonElement>());
	const [thumb, setThumb] = useState<PeriodThumbStyle>(HIDDEN_THUMB);
	const options = useMemo<PeriodSwitchOption[]>(
		() =>
			STATS_PERIODS.map((value) => ({
				value,
				label: messages.statsPeriods[value].short,
				title: messages.statsPeriods[value].title,
				isSelected: value === period,
			})),
		[messages.statsPeriods, period],
	);

	const setOptionRef = useCallback((value: StatsPeriod, node: HTMLButtonElement | null) => {
		if (node) optionRefs.current.set(value, node);
		else optionRefs.current.delete(value);
	}, []);

	const syncThumb = useCallback(() => {
		const track = trackRef.current;
		const selected = optionRefs.current.get(period);
		if (!track || !selected) {
			setThumb(HIDDEN_THUMB);
			return;
		}
		setThumb({
			left: selected.offsetLeft,
			width: selected.offsetWidth,
			ready: true,
		});
	}, [period]);

	useLayoutEffect(() => {
		syncThumb();
		const track = trackRef.current;
		if (!track || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(syncThumb);
		observer.observe(track);
		for (const button of optionRefs.current.values()) observer.observe(button);
		return () => observer.disconnect();
	}, [syncThumb]);

	const select = useCallback((value: StatsPeriod) => setPeriod(value), [setPeriod]);

	return {
		isOnMap,
		label: messages.statsPeriods.switchLabel,
		options,
		select,
		setOptionRef,
		thumb,
		trackRef,
	};
}
