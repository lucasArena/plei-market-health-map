"use client";

import { STATS_PERIODS, type StatsPeriod } from "@market-health-map/core/application";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { PeriodSwitchOption } from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export function usePeriodSwitchRules() {
	const { messages } = useMessages();
	const { period, setPeriod } = useMapScope();
	const isOnMap = usePathname() === "/";
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
	const select = useCallback((value: StatsPeriod) => setPeriod(value), [setPeriod]);
	return { isOnMap, label: messages.statsPeriods.switchLabel, options, select };
}
