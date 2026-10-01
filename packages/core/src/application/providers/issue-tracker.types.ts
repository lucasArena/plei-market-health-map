import type { FeedbackIssueView, FeedbackType } from "@core/application/dtos/feedback-dto.types";

export interface IssueAttachment {
	filename: string;
	contentType: string;
	bytes: Uint8Array;
}

export interface FeedbackIssueSubmitter {
	displayName: string;
	avatarUrl?: string;
}

export interface FeedbackIssueDraft {
	type: FeedbackType;
	title: string;
	requestBody: string;
	submitter: FeedbackIssueSubmitter;
}

export interface IssueTracker {
	uploadAttachment(attachment: IssueAttachment): Promise<string>;
	createIssue(draft: FeedbackIssueDraft): Promise<FeedbackIssueView>;
}
