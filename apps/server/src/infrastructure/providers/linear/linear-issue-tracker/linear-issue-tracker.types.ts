import type { LinearAuth } from "@server/infrastructure/providers/linear/linear-auth/linear-auth.types";
import type { LinearFeedbackConfig } from "@server/infrastructure/providers/linear/linear-feedback-config/linear-feedback-config.types";

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface LinearIssueTrackerOptions {
	auth: LinearAuth;
	config?: LinearFeedbackConfig;
	fetch?: FetchLike;
	timeoutMs?: number;
}
