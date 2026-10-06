"use client";

import { usePeriodSwitchRules } from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent.rules";
import {
	PERIOD_OPTION_CLASS,
	PERIOD_OPTION_SELECTED_CLASS,
	PERIOD_SWITCH_CLASS,
} from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent.styles";

export function PeriodSwitch() {
	const { isOnMap, label, options, select } = usePeriodSwitchRules();

	if (!isOnMap) return null;

	return (
		<fieldset aria-label={label} className={PERIOD_SWITCH_CLASS}>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					title={option.title}
					aria-pressed={option.isSelected}
					onClick={() => select(option.value)}
					className={option.isSelected ? PERIOD_OPTION_SELECTED_CLASS : PERIOD_OPTION_CLASS}
				>
					{option.label}
				</button>
			))}
		</fieldset>
	);
}
