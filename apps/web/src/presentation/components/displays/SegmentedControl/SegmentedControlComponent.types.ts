export interface SegmentedOption<Value extends string> {
	value: Value;
	label: string;
}

export interface SegmentedControlProps<Value extends string> {
	label: string;
	options: SegmentedOption<Value>[];
	value: Value;
	onChange: (value: Value) => void;
}
