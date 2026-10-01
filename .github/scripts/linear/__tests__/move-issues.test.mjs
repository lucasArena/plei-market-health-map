import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	createLinearClient,
	issueIdsIn,
	LINEAR_API_URL,
	LINEAR_OAUTH_TOKEN_URL,
	moveIssues,
	parseArgs,
	planMove,
	requestAppToken,
} from "../move-issues.mjs";

const STATES = { nodes: [
	{ id: "s-feedback", name: "Feedback" },
	{ id: "s-done", name: "Done" },
	{ id: "s-released", name: "Released" },
] };

function issue(identifier, stateName) {
	return { id: `uuid-${identifier}`, identifier, state: { id: "x", name: stateName }, team: { states: STATES } };
}

describe("issueIdsIn", () => {
	it("finds ENG and PROD tickets in titles and branches, once each", () => {
		assert.deepEqual(
			issueIdsIn("feat(map): add panel (ENG-5796)", "feature/eng-5796-panel", "fix: PROD-466 and ENG-12"),
			["ENG-5796", "PROD-466", "ENG-12"],
		);
	});

	it("never picks request tickets or plain words", () => {
		assert.deepEqual(issueIdsIn("Related: REQ-884, UTF-8, v0-6", undefined, ""), []);
	});
});

describe("planMove", () => {
	it("moves to the named status of the ticket's team", () => {
		assert.deepEqual(planMove(issue("ENG-1", "Code Review"), "Feedback"), {
			action: "move",
			stateId: "s-feedback",
			from: "Code Review",
		});
	});

	it("skips missing tickets, tickets already there, protected statuses and unknown statuses", () => {
		assert.equal(planMove(null, "Done").action, "skip");
		assert.equal(planMove(issue("ENG-1", "Done"), "Done").reason, "already Done");
		assert.equal(planMove(issue("ENG-1", "Released"), "Done", ["Released"]).reason, "kept in Released");
		assert.equal(planMove(issue("ENG-1", "To Do"), "QA").reason, "its team has no QA status");
	});
});

describe("moveIssues", () => {
	it("updates each ticket that needs it and logs every decision", async () => {
		const calls = [];
		const tickets = { "ENG-1": issue("ENG-1", "Code Review"), "ENG-2": issue("ENG-2", "Released") };
		const request = async (query, variables) => {
			calls.push(variables);
			if (query.includes("issueUpdate")) return { issueUpdate: { success: true } };
			if (variables.id === "ENG-3") throw new Error("Entity not found");
			return { issue: tickets[variables.id] };
		};
		const logs = [];

		const results = await moveIssues({
			ids: ["ENG-1", "ENG-2", "ENG-3"],
			stateName: "Done",
			skipFrom: ["Released"],
			request,
			log: (line) => logs.push(line),
		});

		assert.deepEqual(results, [
			{ id: "ENG-1", action: "move" },
			{ id: "ENG-2", action: "skip" },
			{ id: "ENG-3", action: "error" },
		]);
		assert.deepEqual(calls[1], { id: "uuid-ENG-1", stateId: "s-done" });
		assert.deepEqual(logs, [
			"ENG-1: Code Review → Done",
			"ENG-2: skipped (kept in Released)",
			"::warning::ENG-3: not moved (Entity not found)",
		]);
	});
});

describe("Linear HTTP", () => {
	it("asks for an app token with the client credentials grant", async () => {
		let sent;
		const fetch = async (url, init) => {
			sent = { url, init };
			return { ok: true, json: async () => ({ access_token: "token-1" }) };
		};

		assert.equal(await requestAppToken({ clientId: "id", clientSecret: "secret", fetch }), "token-1");
		assert.equal(sent.url, LINEAR_OAUTH_TOKEN_URL);
		assert.match(sent.init.body, /grant_type=client_credentials&client_id=id&client_secret=secret/);
		await assert.rejects(
			requestAppToken({ clientId: "id", clientSecret: "bad", fetch: async () => ({ ok: false, status: 401 }) }),
			/status 401/,
		);
	});

	it("sends GraphQL with the bearer token and surfaces errors", async () => {
		let sent;
		const ok = createLinearClient({
			token: "t",
			fetch: async (url, init) => {
				sent = { url, init };
				return { ok: true, json: async () => ({ data: { viewer: { id: "1" } } }) };
			},
		});
		assert.deepEqual(await ok("query { viewer { id } }", {}), { viewer: { id: "1" } });
		assert.equal(sent.url, LINEAR_API_URL);
		assert.equal(sent.init.headers.Authorization, "Bearer t");

		const failing = createLinearClient({
			token: "t",
			fetch: async () => ({ ok: true, json: async () => ({ errors: [{ message: "Forbidden" }] }) }),
		});
		await assert.rejects(failing("query", {}), /Forbidden/);
		const down = createLinearClient({
			token: "t",
			fetch: async () => ({ ok: false, status: 500, json: async () => ({}) }),
		});
		await assert.rejects(down("query", {}), /500/);
	});
});

describe("parseArgs", () => {
	it("reads the status, the protected statuses and the texts", () => {
		assert.deepEqual(parseArgs(["Done", "title ENG-1", "--skip-from", "Released,QA", "branch"]), {
			stateName: "Done",
			skipFrom: ["Released", "QA"],
			texts: ["title ENG-1", "branch"],
		});
		assert.deepEqual(parseArgs(["Feedback", "title"]), {
			stateName: "Feedback",
			skipFrom: [],
			texts: ["title"],
		});
	});
});
