import { pathToFileURL } from "node:url";

export const LINEAR_API_URL = "https://api.linear.app/graphql";
export const LINEAR_OAUTH_TOKEN_URL = "https://api.linear.app/oauth/token";
export const MOVABLE_TEAM_KEYS = ["ENG", "PROD"];

const ISSUE_ID_PATTERN = /\b([A-Za-z][A-Za-z0-9]{1,9})-(\d+)\b/g;

const ISSUE_QUERY = `query Issue($id: String!) {
	issue(id: $id) {
		id
		identifier
		state { id name }
		team { states { nodes { id name } } }
	}
}`;

const ISSUE_UPDATE_MUTATION = `mutation Move($id: String!, $stateId: String!) {
	issueUpdate(id: $id, input: { stateId: $stateId }) { success }
}`;

export function issueIdsIn(...texts) {
	const ids = texts
		.filter(Boolean)
		.flatMap((text) => [...text.matchAll(ISSUE_ID_PATTERN)])
		.map(([, key, number]) => `${key.toUpperCase()}-${number}`)
		.filter((id) => MOVABLE_TEAM_KEYS.includes(id.split("-")[0]));
	return [...new Set(ids)];
}

export function planMove(issue, stateName, skipFrom = []) {
	if (!issue) return { action: "skip", reason: "not found" };
	if (issue.state.name === stateName) return { action: "skip", reason: `already ${stateName}` };
	if (skipFrom.includes(issue.state.name)) {
		return { action: "skip", reason: `kept in ${issue.state.name}` };
	}
	const target = issue.team.states.nodes.find((state) => state.name === stateName);
	if (!target) return { action: "skip", reason: `its team has no ${stateName} status` };
	return { action: "move", stateId: target.id, from: issue.state.name };
}

export async function requestAppToken({ clientId, clientSecret, fetch = globalThis.fetch }) {
	const response = await fetch(LINEAR_OAUTH_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: clientId,
			client_secret: clientSecret,
			scope: "read,write",
		}).toString(),
	});
	if (!response.ok) throw new Error(`Linear token request failed with status ${response.status}.`);
	const { access_token: accessToken } = await response.json();
	return accessToken;
}

export function createLinearClient({ token, fetch = globalThis.fetch }) {
	return async (query, variables) => {
		const response = await fetch(LINEAR_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ query, variables }),
		});
		const payload = await response.json();
		if (!response.ok || payload.errors?.length) {
			throw new Error(payload.errors?.[0]?.message ?? `Linear answered ${response.status}.`);
		}
		return payload.data;
	};
}

export async function moveIssues({ ids, stateName, skipFrom = [], request, log = console.log }) {
	const results = [];
	for (const id of ids) {
		try {
			const { issue } = await request(ISSUE_QUERY, { id });
			const plan = planMove(issue, stateName, skipFrom);
			if (plan.action === "skip") {
				log(`${id}: skipped (${plan.reason})`);
				results.push({ id, action: "skip" });
				continue;
			}
			await request(ISSUE_UPDATE_MUTATION, { id: issue.id, stateId: plan.stateId });
			log(`${issue.identifier}: ${plan.from} → ${stateName}`);
			results.push({ id: issue.identifier, action: "move" });
		} catch (error) {
			log(`::warning::${id}: not moved (${error.message})`);
			results.push({ id, action: "error" });
		}
	}
	return results;
}

export function parseArgs(argv) {
	const [stateName, ...rest] = argv;
	const skipIndex = rest.indexOf("--skip-from");
	const skipFrom = skipIndex === -1 ? [] : rest[skipIndex + 1].split(",");
	const texts = skipIndex === -1 ? rest : rest.filter((_, index) => index < skipIndex || index > skipIndex + 1);
	return { stateName, skipFrom, texts };
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const { stateName, skipFrom, texts } = parseArgs(process.argv.slice(2));
	const ids = issueIdsIn(...texts);
	const { LINEAR_CLIENT_ID: clientId, LINEAR_CLIENT_SECRET: clientSecret } = process.env;
	if (ids.length === 0) {
		console.log("No Linear issue found.");
	} else if (!clientId || !clientSecret) {
		console.log(`::warning::LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET is not set, so ${ids.join(", ")} stayed where they are.`);
	} else {
		try {
			const token = await requestAppToken({ clientId, clientSecret });
			await moveIssues({ ids, stateName, skipFrom, request: createLinearClient({ token }) });
		} catch (error) {
			console.log(`::warning::Could not move ${ids.join(", ")} (${error.message}).`);
		}
	}
}
