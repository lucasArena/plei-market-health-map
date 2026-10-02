import { pathToFileURL } from "node:url";
import { createLinearClient, requestAppToken } from "./move-issues.mjs";

export const FLAG_LABEL = "feature flag";

const ISSUE_LABELS_QUERY = `query IssueLabels($id: String!) {
	issue(id: $id) { identifier labels { nodes { name } } }
}`;

const RELEASE_ISSUES_QUERY = `query ReleaseIssues($id: String!) {
	release(id: $id) { issues(first: 250) { nodes { id identifier labels { nodes { name } } } } }
}`;

const UNLINK_MUTATION = `mutation Unlink($releaseId: String!, $issueId: String!) {
	issueToReleaseDeleteByIssueAndRelease(releaseId: $releaseId, issueId: $issueId) { success }
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

export async function unlinkFlaggedIssues({ releaseId, request, log = console.log }) {
	const { release } = await request(RELEASE_ISSUES_QUERY, { id: releaseId });
	const flagged = (release?.issues.nodes ?? []).filter((issue) => hasFlagLabel(issue.labels.nodes));
	for (const issue of flagged) {
		await request(UNLINK_MUTATION, { releaseId, issueId: issue.id });
		log(`${issue.identifier}: behind a feature flag, removed from the release`);
	}
	return flagged.map((issue) => issue.identifier);
}

export async function linearClientFromEnv(env = process.env) {
	if (!env.LINEAR_CLIENT_ID || !env.LINEAR_CLIENT_SECRET) return null;
	const token = await requestAppToken({
		clientId: env.LINEAR_CLIENT_ID,
		clientSecret: env.LINEAR_CLIENT_SECRET,
	});
	return createLinearClient({ token });
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const [command, releaseId] = process.argv.slice(2);
	try {
		const request = await linearClientFromEnv();
		if (command !== "unlink" || !releaseId) {
			console.log("Usage: node .github/scripts/linear/flagged-issues.mjs unlink <release-id>");
		} else if (!request) {
			console.log("::warning::LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET is not set, so flagged tickets stay in the release.");
		} else {
			await unlinkFlaggedIssues({ releaseId, request });
		}
	} catch (error) {
		console.log(`::warning::Could not remove flagged tickets from the release (${error.message}).`);
	}
}
