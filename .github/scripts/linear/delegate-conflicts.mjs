import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { CURSOR_AGENT_ID, DISABLED_AGENT, delegateReview } from "./delegate-review.mjs";
import { createLinearClient, issueIdsIn, requestAppToken } from "./move-issues.mjs";

export const CONFLICTS_LABEL = "conflicts";
export const MERGEABILITY_ATTEMPTS = 6;
export const MERGEABILITY_WAIT_MS = 5000;

export function createGitHubClient({ token, repo, fetch = globalThis.fetch }) {
	return async (method, path, body) => {
		const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
			method,
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${token}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		if (response.status === 204) return null;
		const payload = await response.json().catch(() => null);
		if (!response.ok) {
			const error = new Error(payload?.message ?? `GitHub answered ${response.status}.`);
			error.status = response.status;
			throw error;
		}
		return payload;
	};
}

export async function mergeabilityOf(github, number, { attempts = MERGEABILITY_ATTEMPTS, wait = sleep } = {}) {
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		const pull = await github("GET", `/pulls/${number}`);
		if (pull.mergeable !== null) return pull.mergeable_state === "dirty" ? "conflicting" : "clean";
		if (attempt < attempts) await wait(MERGEABILITY_WAIT_MS);
	}
	return "unknown";
}

export function planConflictActions(pull, mergeability) {
	const labelled = pull.labels.some((label) => label.name === CONFLICTS_LABEL);
	if (mergeability === "conflicting" && !labelled) return "delegate";
	if (mergeability === "clean" && labelled) return "unlabel";
	return "none";
}

export function buildConflictComment({ number, url, branch, base }) {
	return `[PR #${number}](${url}) has merge conflicts with \`${base}\`. Merge \`${base}\` into the existing branch \`${branch}\`, resolve the conflicts keeping the intent of both sides, make sure \`pnpm check\` passes, and push to that branch; don't open a new PR. If a conflict needs a product decision, leave a comment on this ticket instead of guessing.`;
}

export async function handleConflicts({ github, delegate, base = "staging", log = console.log, wait }) {
	const pulls = await github("GET", `/pulls?state=open&base=${base}&per_page=100`);
	const results = [];
	for (const pull of pulls) {
		const mergeability = await mergeabilityOf(github, pull.number, { wait });
		const action = planConflictActions(pull, mergeability);
		if (action === "delegate") {
			const ids = issueIdsIn(pull.title, pull.head.ref);
			if (ids.length > 0) {
				await delegate(
					ids,
					buildConflictComment({ number: pull.number, url: pull.html_url, branch: pull.head.ref, base }),
				);
			} else {
				log(`#${pull.number}: conflicting, but no Linear ticket in the title or branch`);
			}
			await github("POST", `/issues/${pull.number}/labels`, { labels: [CONFLICTS_LABEL] });
			log(`#${pull.number}: conflicting, handed to the agent`);
		}
		if (action === "unlabel") {
			await github("DELETE", `/issues/${pull.number}/labels/${CONFLICTS_LABEL}`);
			log(`#${pull.number}: no conflicts anymore, label removed`);
		}
		results.push({ number: pull.number, mergeability, action });
	}
	return results;
}

export async function ensureConflictsLabel(github) {
	try {
		await github("POST", "/labels", {
			name: CONFLICTS_LABEL,
			color: "d93f0b",
			description: "Has merge conflicts with staging; handed to the fix agent",
		});
	} catch (error) {
		if (error.status !== 422) throw error;
	}
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const env = process.env;
	const agentId = env.LINEAR_FIX_AGENT_ID || CURSOR_AGENT_ID;
	const github = createGitHubClient({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY });
	try {
		let delegate = async (ids) => console.log(`${ids.join(", ")}: not delegated (agent is off)`);
		if (agentId !== DISABLED_AGENT && env.LINEAR_CLIENT_ID && env.LINEAR_CLIENT_SECRET) {
			const token = await requestAppToken({
				clientId: env.LINEAR_CLIENT_ID,
				clientSecret: env.LINEAR_CLIENT_SECRET,
			});
			const request = createLinearClient({ token });
			delegate = (ids, comment) => delegateReview({ ids, agentId, comment, request });
		}
		await ensureConflictsLabel(github);
		await handleConflicts({ github, delegate });
	} catch (error) {
		console.log(`::warning::Could not check open PRs for conflicts (${error.message}).`);
	}
}
