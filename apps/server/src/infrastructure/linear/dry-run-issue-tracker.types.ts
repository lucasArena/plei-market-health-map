import type { LinearFeedbackConfig } from "@server/infrastructure/linear/linear-feedback-config.types";

export interface DryRunIssueTrackerOptions {
	config?: LinearFeedbackConfig;
	log?: (message: string, payload: string) => void;
}
