export interface KeyInsightsProps {
	title: string;
	text: string;
	introFirst?: boolean;
	isLoading?: boolean;
	tone?: InsightTone;
}

export type InsightTone = "neutral" | "attention" | "stable" | "growing";

export interface InsightToneStyle {
	box: string;
	accent: string;
	fade: string;
	button: string;
	skeleton: string;
}
