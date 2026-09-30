import type { Clock } from "@core/application/ports/clock.types";
import type { FeedbackTitleGenerator } from "@core/application/ports/feedback-title-generator.types";
import type { IssueTracker } from "@core/application/ports/issue-tracker.types";

export interface SubmitFeedbackDeps {
	issues: IssueTracker | null;
	/** Optional. Without it, or when it fails, issues get a generic title by type. */
	titles?: FeedbackTitleGenerator | null;
	clock: Clock;
}
