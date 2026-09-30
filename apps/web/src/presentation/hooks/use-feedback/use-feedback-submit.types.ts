import type { FeedbackType } from "@market-health-map/core/application";

export interface FeedbackSubmission {
	type: FeedbackType;
	message: string;
	images: File[];
	pageUrl?: string;
	view?: string;
}
