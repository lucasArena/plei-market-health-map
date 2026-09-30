export interface PopularTimeCellView {
	key: string;
	dayLabel: string;
	periodLabel: string;
	value: number;
	tooltip: string;
	intensity: number;
}

export interface PopularTimesHeatmapProps {
	title: string;
	dayLabels: string[];
	periodLabels: string[];
	cells: PopularTimeCellView[];
	quietLabel: string;
	busyLabel: string;
}

export interface PopularTimesHeatmapRowProps {
	periodLabel: string;
	cells: PopularTimeCellView[];
	periodIndex: number;
}
