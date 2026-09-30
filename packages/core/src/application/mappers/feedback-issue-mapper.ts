import type { Feedback, FeedbackType } from "@core/application/dtos/feedback-dto.types";
import type {
	FeedbackIssueDraft,
	FeedbackIssueSubmitter,
} from "@core/application/ports/issue-tracker.types";

export const FEEDBACK_TITLE_LENGTH = 80;

export const FEEDBACK_TITLE_PREFIXES: Record<FeedbackType, string> = {
	improvement: "[MHM feedback]",
	bug: "[MHM bug]",
};

export function toFeedbackIssueTitle(type: FeedbackType, message: string): string {
	const flat = message.replace(/\s+/g, " ").trim();
	const summary =
		flat.length > FEEDBACK_TITLE_LENGTH
			? `${flat.slice(0, FEEDBACK_TITLE_LENGTH).trimEnd()}...`
			: flat;
	return `${FEEDBACK_TITLE_PREFIXES[type]} ${summary}`;
}

export function toFeedbackIssueDescription(
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
		title: toFeedbackIssueTitle(feedback.type, feedback.message),
		description: toFeedbackIssueDescription(feedback, assetUrls, submittedAt),
		submitter: toFeedbackIssueSubmitter(feedback),
	};
}
