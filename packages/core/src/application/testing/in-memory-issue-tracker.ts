import type { FeedbackIssueView } from "@core/application/dtos/feedback-dto.types";
import type {
	FeedbackIssueDraft,
	IssueAttachment,
	IssueTracker,
} from "@core/application/providers/issue-tracker.types";

export class InMemoryIssueTracker implements IssueTracker {
	readonly attachments: IssueAttachment[] = [];
	readonly issues: FeedbackIssueDraft[] = [];

	uploadAttachment(attachment: IssueAttachment): Promise<string> {
		this.attachments.push(attachment);
		return Promise.resolve(
			`https://uploads.test/${this.attachments.length}/${attachment.filename}`,
		);
	}

	createIssue(draft: FeedbackIssueDraft): Promise<FeedbackIssueView> {
		this.issues.push(draft);
		const identifier = `TEST-${this.issues.length}`;
		return Promise.resolve({ identifier, url: `https://linear.test/issue/${identifier}` });
	}
}
