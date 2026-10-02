import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildConflictComment,
	CONFLICTS_LABEL,
	createGitHubClient,
	ensureConflictsLabel,
	handleConflicts,
	mergeabilityOf,
	planConflictActions,
} from "../delegate-conflicts.mjs";

const noWait = async () => undefined;

function pull(number, overrides = {}) {
	return {
		number,
		title: `feat(map): thing (ENG-${number})`,
		html_url: `https://github.com/o/r/pull/${number}`,
		head: { ref: `feature/eng-${number}-thing` },
		labels: [],
		...overrides,
	};
}

describe("mergeabilityOf", () => {
	it("waits for GitHub to compute mergeability, then reads it", async () => {
		const answers = [{ mergeable: null }, { mergeable: false, mergeable_state: "dirty" }];
		const github = async () => answers.shift();
		assert.equal(await mergeabilityOf(github, 1, { wait: noWait }), "conflicting");
		assert.equal(
			await mergeabilityOf(async () => ({ mergeable: true, mergeable_state: "clean" }), 1, {
				wait: noWait,
			}),
			"clean",
		);
		assert.equal(
			await mergeabilityOf(async () => ({ mergeable: null }), 1, { attempts: 2, wait: noWait }),
			"unknown",
		);
	});
});

describe("planConflictActions", () => {
	it("delegates new conflicts once and removes the label once they are gone", () => {
		const labelled = pull(1, { labels: [{ name: CONFLICTS_LABEL }] });
		assert.equal(planConflictActions(pull(1), "conflicting"), "delegate");
		assert.equal(planConflictActions(labelled, "conflicting"), "none");
		assert.equal(planConflictActions(labelled, "clean"), "unlabel");
		assert.equal(planConflictActions(pull(1), "clean"), "none");
		assert.equal(planConflictActions(labelled, "unknown"), "none");
	});
});

describe("buildConflictComment", () => {
	it("asks the agent to merge the base into the same branch and push there", () => {
		assert.equal(
			buildConflictComment({
				number: 72,
				url: "https://github.com/o/r/pull/72",
				branch: "feature/eng-1-thing",
				base: "staging",
			}),
			"[PR #72](https://github.com/o/r/pull/72) has merge conflicts with `staging`. Merge `staging` into the existing branch `feature/eng-1-thing`, resolve the conflicts keeping the intent of both sides, make sure `pnpm check` passes, and push to that branch; don't open a new PR. If a conflict needs a product decision, leave a comment on this ticket instead of guessing.",
		);
	});
});

describe("handleConflicts", () => {
	it("hands newly conflicting PRs to the agent, labels them, and clears resolved ones", async () => {
		const calls = [];
		const states = {
			1: { mergeable: false, mergeable_state: "dirty" },
			2: { mergeable: true, mergeable_state: "clean" },
			3: { mergeable: false, mergeable_state: "dirty" },
			4: { mergeable: false, mergeable_state: "dirty" },
		};
		const pulls = [
			pull(1),
			pull(2, { labels: [{ name: CONFLICTS_LABEL }] }),
			pull(3, { labels: [{ name: CONFLICTS_LABEL }] }),
			pull(4, { title: "chore: no ticket", head: { ref: "chore/no-ticket" } }),
		];
		const github = async (method, path, body) => {
			calls.push([method, path, body]);
			if (path.startsWith("/pulls?")) return pulls;
			const number = Number(path.split("/")[2]);
			return method === "GET" ? states[number] : null;
		};
		const delegated = [];
		const logs = [];

		const results = await handleConflicts({
			github,
			delegate: async (ids, comment) => delegated.push([ids, comment]),
			log: (line) => logs.push(line),
			wait: noWait,
		});

		assert.deepEqual(
			results.map(({ number, action }) => [number, action]),
			[
				[1, "delegate"],
				[2, "unlabel"],
				[3, "none"],
				[4, "delegate"],
			],
		);
		assert.deepEqual(delegated.map(([ids]) => ids), [["ENG-1"]]);
		assert.match(delegated[0][1], /PR #1/);
		assert.deepEqual(
			calls.filter(([method]) => method !== "GET"),
			[
				["POST", "/issues/1/labels", { labels: [CONFLICTS_LABEL] }],
				["DELETE", `/issues/2/labels/${CONFLICTS_LABEL}`, undefined],
				["POST", "/issues/4/labels", { labels: [CONFLICTS_LABEL] }],
			],
		);
		assert.ok(logs.includes("#4: conflicting, but no Linear ticket in the title or branch"));
		assert.equal(calls[0][1], "/pulls?state=open&base=staging&per_page=100");
	});
});

describe("GitHub helpers", () => {
	it("sends authenticated JSON requests and surfaces failures with their status", async () => {
		let sent;
		const github = createGitHubClient({
			token: "t",
			repo: "o/r",
			fetch: async (url, init) => {
				sent = { url, init };
				return { ok: true, status: 200, json: async () => ({ ok: 1 }) };
			},
		});
		assert.deepEqual(await github("POST", "/labels", { name: "x" }), { ok: 1 });
		assert.equal(sent.url, "https://api.github.com/repos/o/r/labels");
		assert.equal(sent.init.headers.Authorization, "Bearer t");
		assert.equal(sent.init.body, JSON.stringify({ name: "x" }));

		const empty = createGitHubClient({
			token: "t",
			repo: "o/r",
			fetch: async () => ({ ok: true, status: 204 }),
		});
		assert.equal(await empty("DELETE", "/x"), null);

		const failing = createGitHubClient({
			token: "t",
			repo: "o/r",
			fetch: async () => ({ ok: false, status: 422, json: async () => ({ message: "exists" }) }),
		});
		await assert.rejects(failing("POST", "/labels", {}), (error) => error.status === 422);
		const unreadable = createGitHubClient({
			token: "t",
			repo: "o/r",
			fetch: async () => ({ ok: false, status: 500, json: async () => Promise.reject(new Error("x")) }),
		});
		await assert.rejects(unreadable("GET", "/x"), /500/);
	});

	it("creates the conflicts label once and ignores it already existing", async () => {
		const exists = Object.assign(new Error("exists"), { status: 422 });
		await ensureConflictsLabel(async () => {
			throw exists;
		});
		const down = Object.assign(new Error("down"), { status: 500 });
		await assert.rejects(
			ensureConflictsLabel(async () => {
				throw down;
			}),
			/down/,
		);
	});
});
