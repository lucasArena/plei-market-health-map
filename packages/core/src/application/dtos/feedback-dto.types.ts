import type { FEEDBACK_TYPES, submitFeedbackSchema } from "@core/application/dtos/feedback-dto";
import type { z } from "zod";

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type SubmitFeedbackInput = z.input<typeof submitFeedbackSchema>;
export type Feedback = z.output<typeof submitFeedbackSchema>;

export interface FeedbackIssueView {
	identifier: string;
	url: string;
}
