import type { Clock } from "@core/application/providers/clock.types";
import type { IssueTracker } from "@core/application/providers/issue-tracker.types";

export interface SubmitFeedbackDeps {
	issues: IssueTracker | null;
	clock: Clock;
}
