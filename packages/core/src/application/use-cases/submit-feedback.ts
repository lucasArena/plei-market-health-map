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
import type {
	FeedbackTitleGenerator,
	FeedbackTitleRequest,
} from "@core/application/ports/feedback-title-generator.types";
import type { SubmitFeedbackDeps } from "@core/application/use-cases/submit-feedback.types";

/** Title generation is optional: any failure means the generic title is used. */
async function generateTitle(
	titles: FeedbackTitleGenerator | null | undefined,
	request: FeedbackTitleRequest,
): Promise<string | null> {
	if (!titles) return null;
	try {
		return await titles.generateTitle(request);
	} catch {
		return null;
	}
}

export function makeSubmitFeedback({ issues, titles, clock }: SubmitFeedbackDeps) {
	return async function submitFeedback(input: SubmitFeedbackInput): Promise<FeedbackIssueView> {
		if (!issues) throw new FeedbackNotConfiguredError();
		const parsed = submitFeedbackSchema.safeParse(input);
		if (!parsed.success) throw new InvalidRequestError(parsed.error.issues);

		const feedback = parsed.data;
		const imageBytes = feedback.images.reduce((total, image) => total + image.bytes.byteLength, 0);
		if (imageBytes > MAX_FEEDBACK_REQUEST_BYTES) {
			throw new PayloadTooLargeError(MAX_FEEDBACK_REQUEST_BYTES);
		}
		const title = generateTitle(titles, { type: feedback.type, message: feedback.message });
		const assetUrls: string[] = [];
		for (const image of feedback.images) {
			assetUrls.push(await issues.uploadAttachment(image));
		}
		return issues.createIssue(toFeedbackIssueDraft(feedback, assetUrls, clock.now(), await title));
	};
}
