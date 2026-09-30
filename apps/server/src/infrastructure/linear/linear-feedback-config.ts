import type { FeedbackIssueDraft } from "@market-health-map/core/application";
import type {
	LinearFeedbackConfig,
	LinearIssueCreateInput,
	LinearIssueInputOptions,
} from "@server/infrastructure/linear/linear-feedback-config.types";

export const DEFAULT_LINEAR_FEEDBACK_CONFIG: LinearFeedbackConfig = {
	projectId: "98a63408-5cac-4a0e-85a9-1b73d17ea096",
	routes: {
		improvement: {
			teamId: "635f83c3-3276-4ae6-aa29-5b633dc8dc38",
			stateId: "973949af-0a76-4de3-a870-de074888bc75",
			labelIds: [],
		},
		bug: {
			teamId: "bd06d3df-8b17-42f7-96b1-0b6b7b3eb5ad",
			stateId: "904a3068-92b9-4e7d-bd86-bc52cde54a83",
			labelIds: ["66be57d9-22f0-4fba-a55a-9e0782dd3c0d"],
		},
	},
};

export function toLinearIssueInput(
	draft: FeedbackIssueDraft,
	config: LinearFeedbackConfig,
	{ asApp = false }: LinearIssueInputOptions = {},
): LinearIssueCreateInput {
	const route = config.routes[draft.type];
	const { displayName, avatarUrl } = draft.submitter;
	const actor = asApp
		? { createAsUser: displayName, ...(avatarUrl ? { displayIconUrl: avatarUrl } : {}) }
		: {};
	return {
		teamId: route.teamId,
		stateId: route.stateId,
		projectId: config.projectId,
		labelIds: route.labelIds,
		title: draft.title,
		description: draft.description,
		...actor,
	};
}
