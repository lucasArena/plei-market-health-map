import type { StatsPeriod } from "@market-health-map/core/application";

export interface PeriodSwitchOption {
	value: StatsPeriod;
	label: string;
	title: string;
	isSelected: boolean;
}
