import type { GamesTrendDirection } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

export type MetricTone = "good" | "bad" | "neutral";

export interface MetricChangeView {
	label: string;
	direction: GamesTrendDirection;
	tone: MetricTone;
}

export interface MetricRowView {
	key: string;
	label: string;
	value: string;
	previous: string;
	change: MetricChangeView | null;
	isPending?: boolean;
}

export interface MetricRowsProps {
	metrics: MetricRowView[];
	testId: string;
}

export interface MetricValueProps {
	metric: MetricRowView;
}
