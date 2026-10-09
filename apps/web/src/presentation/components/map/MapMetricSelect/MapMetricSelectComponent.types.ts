export interface MapMetricSelectOption {
	value: string;
	label: string;
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
