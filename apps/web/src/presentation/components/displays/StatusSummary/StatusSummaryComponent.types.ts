export type StatusTone = "attention" | "onTrack" | "growing";

export interface StatusToneStyle {
	box: string;
	pill: string;
	dot: string;
}

export interface StatusSummaryProps {
	tone: StatusTone;
	label: string;
	headline: string;
	detail: string | null;
}
