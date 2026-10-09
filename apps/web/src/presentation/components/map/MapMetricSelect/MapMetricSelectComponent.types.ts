export interface MapMetricSelectOption {
	value: string;
	label: string;
	children?: readonly MapMetricSelectOption[];
}
export type MapMetricSelectVariant = "field" | "pill";
export interface MapMetricSelectProps {
	label: string;
	help: string;
	value: string;
	options: readonly MapMetricSelectOption[];
	disabled?: boolean;
	descriptionId?: string;
	alignRight?: boolean;
	variant?: MapMetricSelectVariant;
	onChange(value: string): void;
}

export interface MapMetricSubmenu {
	focus: boolean;
	value: string;
	left: number;
	top: number;
}
