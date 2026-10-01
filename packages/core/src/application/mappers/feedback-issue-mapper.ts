import type { Feedback, FeedbackType } from "@core/application/dtos/feedback-dto.types";
import type {
	FeedbackIssueDraft,
	FeedbackIssueSubmitter,
} from "@core/application/providers/issue-tracker.types";

export const FEEDBACK_TITLES: Record<FeedbackType, string> = {
	improvement: "Feedback",
	bug: "Bug Report",
};

/** "Bug Report from Lucas Arena". Uses the email without a name, and the plain title without either. */
export function toFeedbackIssueTitle(
	type: FeedbackType,
	submitter?: Feedback["submitter"],
): string {
	const reporter = submitter?.name?.trim() || submitter?.email?.trim();
	return reporter ? `${FEEDBACK_TITLES[type]} from ${reporter}` : FEEDBACK_TITLES[type];
}

export function toFeedbackCustomerRequestBody(
	feedback: Feedback,
	assetUrls: string[],
	submittedAt: Date,
): string {
	const { name, email } = feedback.submitter;
	const details = [
		`- **Submitted by:** ${name ? `${name} (${email})` : email}`,
		...(feedback.pageUrl ? [`- **Page:** ${feedback.pageUrl}`] : []),
		...(feedback.view ? [`- **View:** ${feedback.view}`] : []),
		`- **Submitted at:** ${submittedAt.toISOString()}`,
	];
	const screenshots = assetUrls.length
		? ["**Screenshots**", ...assetUrls.map((assetUrl) => `![](${assetUrl})`)]
		: [];
	return [feedback.message, "---", details.join("\n"), ...screenshots].join("\n\n");
}

export function toFeedbackIssueSubmitter(feedback: Feedback): FeedbackIssueSubmitter {
	const { name, email, avatarUrl } = feedback.submitter;
	return { displayName: name || email, ...(avatarUrl ? { avatarUrl } : {}) };
}

export function toFeedbackIssueDraft(
	feedback: Feedback,
	assetUrls: string[],
	submittedAt: Date,
): FeedbackIssueDraft {
	return {
		type: feedback.type,
		title: toFeedbackIssueTitle(feedback.type, feedback.submitter),
		requestBody: toFeedbackCustomerRequestBody(feedback, assetUrls, submittedAt),
		submitter: toFeedbackIssueSubmitter(feedback),
	};
}
