export interface MapMetricSelectOption {
	value: string;
	label: string;
}
export interface MapMetricSelectProps {
	label: string;
	help: string;
	value: string;
	options: readonly MapMetricSelectOption[];
	disabled?: boolean;
	descriptionId?: string;
	alignRight?: boolean;
	onChange(value: string): void;
}
