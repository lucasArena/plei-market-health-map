import type { LinearFeedbackConfig } from "@server/infrastructure/linear/linear-feedback-config.types";

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface LinearIssueTrackerOptions {
	apiKey: string;
	config?: LinearFeedbackConfig;
	fetch?: FetchLike;
	timeoutMs?: number;
}
