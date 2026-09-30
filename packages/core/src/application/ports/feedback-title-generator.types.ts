import type { FeedbackType } from "@core/application/dtos/feedback-dto.types";

export interface FeedbackTitleRequest {
	type: FeedbackType;
	message: string;
}

export interface FeedbackTitleGenerator {
	/** Returns a short title for the feedback, or null when none could be generated. */
	generateTitle(request: FeedbackTitleRequest): Promise<string | null>;
}
