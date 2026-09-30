import type { Clock } from "@core/application/ports/clock.types";
import type { IssueTracker } from "@core/application/ports/issue-tracker.types";

export interface SubmitFeedbackDeps {
	issues: IssueTracker | null;
	clock: Clock;
}
