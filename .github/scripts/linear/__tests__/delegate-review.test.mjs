import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildReviewComment,
	CURSOR_AGENT_ID,
	delegateReview,
	parseInlineComments,
} from "../delegate-review.mjs";

describe("parseInlineComments", () => {
	it("keeps comments with a body and ignores anything unreadable", () => {
		assert.deepEqual(
			parseInlineComments(
				JSON.stringify([
					{ path: "a.ts", line: 3, body: "Rename this" },
					{ path: "b.ts", line: null, body: "" },
				]),
			),
			[{ path: "a.ts", line: 3, body: "Rename this" }],
		);
		assert.deepEqual(parseInlineComments("not json"), []);
		assert.deepEqual(parseInlineComments('{"path":"a"}'), []);
		assert.deepEqual(parseInlineComments(undefined), []);
	});
});

describe("buildReviewComment", () => {
	it("tells the agent where to push and quotes the review and inline comments", () => {
		const comment = buildReviewComment({
			prNumber: "72",
			prUrl: "https://github.com/o/r/pull/72",
			branch: "feature/eng-1-thing",
			reviewer: "lucasArena",
			body: "Two things:\nfix the label",
			comments: [
				{ path: "apps/web/a.tsx", line: 12, body: " Use the i18n key " },
				{ path: "docs/x.md", body: "Shorter" },
			],
		});

		assert.equal(
			comment,
			[
				"Changes were requested on [PR #72](https://github.com/o/r/pull/72) by @lucasArena. Fix them on the existing branch `feature/eng-1-thing` and push to it; don't open a new PR. Follow AGENTS.md and make sure `pnpm check` passes.",
				"",
				"**Review**",
				"",
				"> Two things:",
				"> fix the label",
				"",
				"**Inline comments**",
				"",
				"- `apps/web/a.tsx:12`: Use the i18n key",
				"- `docs/x.md`: Shorter",
			].join("\n"),
		);
	});

	it("leaves out empty sections", () => {
		const comment = buildReviewComment({
			prNumber: "1",
			prUrl: "u",
			branch: "b",
			reviewer: "r",
			body: "  ",
			comments: [],
		});
		assert.ok(!comment.includes("**Review**"));
		assert.ok(!comment.includes("**Inline comments**"));
	});
});

describe("delegateReview", () => {
	it("posts the review, then delegates, re-delegating when the agent already has the ticket", async () => {
		const calls = [];
		const issues = {
			"ENG-1": { id: "u1", identifier: "ENG-1", delegate: null },
			"ENG-2": { id: "u2", identifier: "ENG-2", delegate: { id: CURSOR_AGENT_ID } },
		};
		const request = async (query, variables) => {
			calls.push([query.match(/(Issue|Comment|Delegate)/)[1], variables]);
			if (query.includes("issue(id")) {
				if (variables.id === "ENG-9") throw new Error("Entity not found");
				return { issue: issues[variables.id] ?? null };
			}
			return {};
		};
		const logs = [];

		const results = await delegateReview({
			ids: ["ENG-1", "ENG-2", "ENG-3", "ENG-9"],
			agentId: CURSOR_AGENT_ID,
			comment: "fix it",
			request,
			log: (line) => logs.push(line),
		});

		assert.deepEqual(results, [
			{ id: "ENG-1", action: "delegate" },
			{ id: "ENG-2", action: "delegate" },
			{ id: "ENG-3", action: "skip" },
			{ id: "ENG-9", action: "error" },
		]);
		assert.deepEqual(calls.slice(0, 3), [
			["Issue", { id: "ENG-1" }],
			["Comment", { issueId: "u1", body: "fix it" }],
			["Delegate", { id: "u1", delegateId: CURSOR_AGENT_ID }],
		]);
		assert.deepEqual(calls.slice(3, 7), [
			["Issue", { id: "ENG-2" }],
			["Comment", { issueId: "u2", body: "fix it" }],
			["Delegate", { id: "u2", delegateId: null }],
			["Delegate", { id: "u2", delegateId: CURSOR_AGENT_ID }],
		]);
		assert.deepEqual(logs, [
			"ENG-1: review posted and delegated to the agent",
			"ENG-2: review posted and delegated to the agent",
			"ENG-3: skipped (not found)",
			"::warning::ENG-9: not delegated (Entity not found)",
		]);
	});
});
