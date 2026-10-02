export interface PopularTimeCellView {
	key: string;
	dayLabel: string;
	periodLabel: string;
	value: number;
	label: string;
	tooltip: string;
	intensity: number;
}

export interface PopularTimesHeatmapProps {
	title: string;
	dayLabels: string[];
	periodLabels: string[];
	periodRanges: string[];
	cells: PopularTimeCellView[];
	quietLabel: string;
	busyLabel: string;
}

export interface PopularTimesHeatmapRowProps {
	periodLabel: string;
	periodRange: string;
	cells: PopularTimeCellView[];
	periodIndex: number;
}
