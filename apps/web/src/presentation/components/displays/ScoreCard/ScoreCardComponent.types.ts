import type { MetricTone } from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";

export type ScoreCardSize = "primary" | "secondary";

export interface ScoreCardChange {
	label: string;
	tone: MetricTone;
}

export interface ScoreCardProps {
	label: string;
	info: string;
	value: string;
	change: ScoreCardChange | null;
	caption?: string;
	aside?: string;
	size?: ScoreCardSize;
	testId: string;
}
