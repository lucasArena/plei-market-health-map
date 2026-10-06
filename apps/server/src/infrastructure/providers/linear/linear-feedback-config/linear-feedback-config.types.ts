import type { FeedbackType } from "@market-health-map/core/application";

export interface LinearFeedbackRoute {
	teamId: string;
	stateId: string;
	labelIds: string[];
}

export interface LinearFeedbackConfig {
	projectId: string;
	routes: Record<FeedbackType, LinearFeedbackRoute>;
}

export interface LinearIssueCreateInput {
	teamId: string;
	stateId: string;
	projectId: string;
	labelIds: string[];
	title: string;
	description?: string;
	createAsUser?: string;
	displayIconUrl?: string;
}

export interface LinearCustomerNeedCreateInput {
	issueId: string;
	body: string;
	createAsUser?: string;
	displayIconUrl?: string;
}

export interface LinearIssueInputOptions {
	asApp?: boolean;
}
