import {
	MAX_FEEDBACK_REQUEST_BYTES,
	submitFeedbackSchema,
} from "@core/application/dtos/feedback-dto";
import type {
	FeedbackIssueView,
	SubmitFeedbackInput,
} from "@core/application/dtos/feedback-dto.types";
import { FeedbackNotConfiguredError } from "@core/application/errors/feedback-not-configured-error";
import { InvalidRequestError } from "@core/application/errors/invalid-request-error";
import { PayloadTooLargeError } from "@core/application/errors/payload-too-large-error";
import { toFeedbackIssueDraft } from "@core/application/mappers/feedback-issue-mapper";
import type { SubmitFeedbackDeps } from "@core/application/use-cases/submit-feedback.types";

export function makeSubmitFeedback({ issues, clock }: SubmitFeedbackDeps) {
	return async function submitFeedback(input: SubmitFeedbackInput): Promise<FeedbackIssueView> {
		if (!issues) throw new FeedbackNotConfiguredError();
		const parsed = submitFeedbackSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);

		const feedback = parsed.data;
		const imageBytes = feedback.images.reduce((total, image) => total + image.bytes.byteLength, 0);
		if (imageBytes > MAX_FEEDBACK_REQUEST_BYTES) {
			throw new PayloadTooLargeError(MAX_FEEDBACK_REQUEST_BYTES);
		}
		const assetUrls: string[] = [];
		for (const image of feedback.images) {
			assetUrls.push(await issues.uploadAttachment(image));
		}
		return issues.createIssue(toFeedbackIssueDraft(feedback, assetUrls, clock.now()));
	};
}
