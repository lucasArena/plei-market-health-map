import { pathToFileURL } from "node:url";
import { createLinearClient, issueIdsIn, requestAppToken } from "./move-issues.mjs";

export const CURSOR_AGENT_ID = "7d53c5e9-5cfb-4e7f-aa63-50bc73cb713e";
export const DISABLED_AGENT = "off";

const ISSUE_QUERY = `query Issue($id: String!) {
	issue(id: $id) { id identifier delegate { id } }
}`;

const COMMENT_MUTATION = `mutation Comment($issueId: String!, $body: String!) {
	commentCreate(input: { issueId: $issueId, body: $body }) { success }
}`;

const DELEGATE_MUTATION = `mutation Delegate($id: String!, $delegateId: String) {
	issueUpdate(id: $id, input: { delegateId: $delegateId }) { success }
}`;

export function parseInlineComments(json) {
	try {
		const comments = JSON.parse(json || "[]");
		return Array.isArray(comments) ? comments.filter((comment) => comment?.body) : [];
	} catch {
		return [];
	}
}

function quote(text) {
	return text
		.trim()
		.split("\n")
		.map((line) => `> ${line}`)
		.join("\n");
}

function location({ path, line }) {
	return line ? `${path}:${line}` : path;
}

export function buildReviewComment({ prNumber, prUrl, branch, reviewer, body, comments }) {
	const intro = `Changes were requested on [PR #${prNumber}](${prUrl}) by @${reviewer}. Fix them on the existing branch \`${branch}\` and push to it; don't open a new PR. Follow AGENTS.md and make sure \`pnpm check\` passes.`;
	const review = body?.trim() ? ["", "**Review**", "", quote(body)] : [];
	const inline =
		comments.length > 0
			? ["", "**Inline comments**", "", ...comments.map((comment) => `- \`${location(comment)}\`: ${comment.body.trim()}`)]
			: [];
	return [intro, ...review, ...inline].join("\n");
}

export async function delegateReview({ ids, agentId, comment, request, log = console.log }) {
	const results = [];
	for (const id of ids) {
		try {
			const { issue } = await request(ISSUE_QUERY, { id });
			if (!issue) {
				log(`${id}: skipped (not found)`);
				results.push({ id, action: "skip" });
				continue;
			}
			await request(COMMENT_MUTATION, { issueId: issue.id, body: comment });
			if (issue.delegate?.id === agentId) {
				await request(DELEGATE_MUTATION, { id: issue.id, delegateId: null });
			}
			await request(DELEGATE_MUTATION, { id: issue.id, delegateId: agentId });
			log(`${issue.identifier}: comment posted and delegated to the agent`);
			results.push({ id: issue.identifier, action: "delegate" });
		} catch (error) {
			log(`::warning::${id}: not delegated (${error.message})`);
			results.push({ id, action: "error" });
		}
	}
	return results;
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const env = process.env;
	const agentId = env.LINEAR_FIX_AGENT_ID || CURSOR_AGENT_ID;
	const ids = issueIdsIn(env.TITLE, env.HEAD_REF);
	if (agentId === DISABLED_AGENT) {
		console.log("The review agent is off (LINEAR_FIX_AGENT_ID=off).");
	} else if (ids.length === 0) {
		console.log("No Linear issue found.");
	} else if (!env.LINEAR_CLIENT_ID || !env.LINEAR_CLIENT_SECRET) {
		console.log(`::warning::LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET is not set, so ${ids.join(", ")} was not delegated.`);
	} else {
		const comment = buildReviewComment({
			prNumber: env.PR_NUMBER,
			prUrl: env.PR_URL,
			branch: env.HEAD_REF,
			reviewer: env.REVIEWER,
			body: env.REVIEW_BODY,
			comments: parseInlineComments(env.REVIEW_COMMENTS),
		});
		try {
			const token = await requestAppToken({
				clientId: env.LINEAR_CLIENT_ID,
				clientSecret: env.LINEAR_CLIENT_SECRET,
			});
			await delegateReview({ ids, agentId, comment, request: createLinearClient({ token }) });
		} catch (error) {
			console.log(`::warning::Could not delegate ${ids.join(", ")} (${error.message}).`);
		}
	}
}
