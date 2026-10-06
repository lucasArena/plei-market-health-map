import { createLinearClient, requestAppToken } from "./move-issues.mjs";

export const FLAG_LABEL = "feature flag";

const ISSUE_LABELS_QUERY = `query IssueLabels($id: String!) {
	issue(id: $id) { identifier labels { nodes { name } } }
}`;

export function hasFlagLabel(labels) {
	return labels.some((label) => label.name.trim().toLowerCase() === FLAG_LABEL);
}

export async function flaggedIssueIds({ ids, request, log = console.log }) {
	const flagged = [];
	for (const id of ids) {
		try {
			const { issue } = await request(ISSUE_LABELS_QUERY, { id });
			if (issue && hasFlagLabel(issue.labels.nodes)) flagged.push(id);
		} catch (error) {
			log(`::warning::${id}: could not read its labels (${error.message}), so it stays in the release`);
		}
	}
	return flagged;
}

export async function linearClientFromEnv(env = process.env) {
	if (!env.LINEAR_CLIENT_ID || !env.LINEAR_CLIENT_SECRET) return null;
	const token = await requestAppToken({
		clientId: env.LINEAR_CLIENT_ID,
		clientSecret: env.LINEAR_CLIENT_SECRET,
	});
	return createLinearClient({ token });
}
