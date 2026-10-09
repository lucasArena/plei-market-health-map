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
	/** Lets a host panel match its own section title style. */
	titleClassName?: string;
	/** Insight panel: the drill-down glass tooltip surface instead of the dark green one. */
	hasGlassTooltips?: boolean;
}

export interface PopularTimesHeatmapRowProps {
	periodLabel: string;
	periodRange: string;
	cells: PopularTimeCellView[];
	periodIndex: number;
	tooltipClass: string;
}
