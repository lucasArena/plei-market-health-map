import type {
	FeedbackIssueDraft,
	FeedbackIssueView,
	IssueAttachment,
	IssueTracker,
} from "@market-health-map/core/application";
import type { DryRunIssueTrackerOptions } from "@server/infrastructure/linear/dry-run-issue-tracker.types";
import {
	DEFAULT_LINEAR_FEEDBACK_CONFIG,
	toLinearIssueInput,
} from "@server/infrastructure/linear/linear-feedback-config";
import type { LinearFeedbackConfig } from "@server/infrastructure/linear/linear-feedback-config.types";

export const DRY_RUN_ASSET_BASE_URL = "https://uploads.linear.app/dry-run";
export const DRY_RUN_ISSUE_BASE_URL = "https://linear.app/dry-run/issue";

export class DryRunIssueTracker implements IssueTracker {
	private readonly config: LinearFeedbackConfig;
	private readonly log: (message: string, payload: string) => void;
	private uploads = 0;
	private issues = 0;

	constructor({
		config = DEFAULT_LINEAR_FEEDBACK_CONFIG,
		log = (message, payload) => console.info(message, payload),
	}: DryRunIssueTrackerOptions = {}) {
		this.config = config;
		this.log = log;
	}

	uploadAttachment({ filename, contentType, bytes }: IssueAttachment): Promise<string> {
		this.uploads += 1;
		this.log(
			"[feedback:dry-run] would upload",
			JSON.stringify({ filename, contentType, size: bytes.byteLength }),
		);
		return Promise.resolve(
			`${DRY_RUN_ASSET_BASE_URL}/${this.uploads}/${encodeURIComponent(filename)}`,
		);
	}

	createIssue(draft: FeedbackIssueDraft): Promise<FeedbackIssueView> {
		this.issues += 1;
		const identifier = `DRY-${this.issues}`;
		this.log(
			"[feedback:dry-run] would create issue",
			JSON.stringify(toLinearIssueInput(draft, this.config), null, 2),
		);
		return Promise.resolve({ identifier, url: `${DRY_RUN_ISSUE_BASE_URL}/${identifier}` });
	}
}
