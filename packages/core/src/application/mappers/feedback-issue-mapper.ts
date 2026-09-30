import type { Feedback, FeedbackType } from "@core/application/dtos/feedback-dto.types";
import type {
	FeedbackIssueDraft,
	FeedbackIssueSubmitter,
} from "@core/application/ports/issue-tracker.types";

export const MAX_FEEDBACK_TITLE_LENGTH = 80;
export const MAX_FEEDBACK_TITLE_WORDS = 10;

export const FEEDBACK_FALLBACK_TITLES: Record<FeedbackType, string> = {
	improvement: "Feedback",
	bug: "Bug Report",
};

/**
 * Cleans a generated title: first line only, no "Title:" label, quotes, markdown or
 * trailing period, first letter upper case. Returns null when nothing usable is left
 * or when it is too long to be a title.
 */
export function normalizeFeedbackTitle(raw: string | null | undefined): string | null {
	const line = raw?.split(/\r?\n/).find((part) => part.trim()) ?? "";
	const title = line
		.replace(/^\s*title\s*:\s*/i, "")
		.replace(/^[\s"'`*#_]+|[\s"'`*_]+$/g, "")
		.replace(/\s+/g, " ")
		.replace(/[.\s]+$/, "");
	if (!title) return null;
	if (title.length > MAX_FEEDBACK_TITLE_LENGTH) return null;
	if (title.split(" ").length > MAX_FEEDBACK_TITLE_WORDS) return null;
	return title.charAt(0).toUpperCase() + title.slice(1);
}

export function toFeedbackIssueTitle(type: FeedbackType, generated?: string | null): string {
	return normalizeFeedbackTitle(generated) ?? FEEDBACK_FALLBACK_TITLES[type];
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
	generatedTitle?: string | null,
): FeedbackIssueDraft {
	return {
		type: feedback.type,
		title: toFeedbackIssueTitle(feedback.type, generatedTitle),
		description: toFeedbackIssueDescription(feedback, assetUrls, submittedAt),
		submitter: toFeedbackIssueSubmitter(feedback),
	};
}
