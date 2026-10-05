export interface MetricCheck {
	pattern: RegExp;
	change: number | null;
}

export interface InsightChecks {
	metrics: MetricCheck[];
	contributorPercents: number[];
}

export type ChangeDirection = "up" | "down";
