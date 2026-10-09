export interface KeyInsightsProps {
	title: string;
	text: string;
	introFirst?: boolean;
	isLoading?: boolean;
	tone?: InsightTone;
	/** Insight panel: title uses the panel section heading instead of the small boxed label. */
	isFlat?: boolean;
}

export type InsightTone = "neutral" | "attention" | "stable" | "growing";

export interface InsightToneStyle {
	box: string;
	accent: string;
	fade: string;
	button: string;
	skeleton: string;
}
