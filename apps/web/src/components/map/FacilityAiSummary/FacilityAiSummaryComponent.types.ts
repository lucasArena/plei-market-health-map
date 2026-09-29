import type { FacilityDetailView } from "@market-health-map/application";

export interface FacilityAiSummaryProps {
	detail: FacilityDetailView;
	fallback: string;
}

export type FacilityAiSummaryStatus =
	| "checking"
	| "unsupported"
	| "idle"
	| "loading"
	| "generating"
	| "ready"
	| "error";

export interface FacilityAiSummaryState {
	status: FacilityAiSummaryStatus;
	text: string | null;
	progress: number;
}
