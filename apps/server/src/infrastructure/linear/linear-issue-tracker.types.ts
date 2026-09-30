import type { LinearAuth } from "@server/infrastructure/linear/linear-auth.types";
import type { LinearFeedbackConfig } from "@server/infrastructure/linear/linear-feedback-config.types";

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface LinearIssueTrackerOptions {
	auth: LinearAuth;
	config?: LinearFeedbackConfig;
	fetch?: FetchLike;
	timeoutMs?: number;
}
