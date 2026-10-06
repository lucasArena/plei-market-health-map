export interface MapMetricOption {
	value: string;
	label: string;
}
export interface MapMetricSelectProps {
	label: string;
	value: string;
	options: readonly MapMetricOption[];
	onSelect: (value: string) => void;
}
