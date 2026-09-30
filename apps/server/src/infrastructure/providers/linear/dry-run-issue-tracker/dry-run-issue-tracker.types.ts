import type { LinearFeedbackConfig } from "@server/infrastructure/providers/linear/linear-feedback-config/linear-feedback-config.types";

export interface DryRunIssueTrackerOptions {
	config?: LinearFeedbackConfig;
	log?: (message: string, payload: string) => void;
}
