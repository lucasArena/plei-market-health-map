"use client";

import { usePeriodSwitchRules } from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent.rules";
import {
	PERIOD_OPTION_CLASS,
	PERIOD_OPTION_SELECTED_CLASS,
	PERIOD_SWITCH_CLASS,
	PERIOD_THUMB_CLASS,
} from "@/presentation/components/inputs/PeriodSwitch/PeriodSwitchComponent.styles";

export function PeriodSwitch() {
	const { isOnMap, label, options, select, setOptionRef, thumb, trackRef } = usePeriodSwitchRules();

	if (!isOnMap) return null;

	return (
		<fieldset ref={trackRef} aria-label={label} className={PERIOD_SWITCH_CLASS}>
			<span
				aria-hidden="true"
				data-testid="period-switch-thumb"
				className={PERIOD_THUMB_CLASS}
				style={{
					width: thumb.width,
					opacity: thumb.ready ? 1 : 0,
					transform: `translateX(${thumb.left}px)`,
				}}
			/>
			{options.map((option) => (
				<button
					key={option.value}
					ref={(node) => setOptionRef(option.value, node)}
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
