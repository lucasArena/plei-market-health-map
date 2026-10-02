import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	FLAG_LABEL,
	flaggedIssueIds,
	hasFlagLabel,
	linearClientFromEnv,
	linkIssues,
	unlinkFlaggedIssues,
} from "../flagged-issues.mjs";

describe("hasFlagLabel", () => {
	it("matches only the feature flag label, in any case", () => {
		assert.equal(FLAG_LABEL, "feature flag");
		assert.equal(hasFlagLabel([{ name: "bug" }, { name: " Feature Flag " }]), true);
		assert.equal(hasFlagLabel([{ name: "flag" }, { name: "feature" }, { name: "feature flags" }]), false);
		assert.equal(hasFlagLabel([]), false);
	});
});

describe("flaggedIssueIds", () => {
	it("returns the referenced tickets that carry the flag label, keeping their original IDs", async () => {
		const labels = {
			"ENG-1": [{ name: "feature flag" }],
			"PROD-466": [{ name: "Feature flag" }],
			"ENG-2": [{ name: "flag" }],
		};
		const request = async (_query, { id }) => {
			if (id === "ENG-9") throw new Error("Entity not found");
			return { issue: id in labels ? { identifier: id, labels: { nodes: labels[id] } } : null };
		};
		const logs = [];

		const flagged = await flaggedIssueIds({
			ids: ["ENG-1", "PROD-466", "ENG-2", "ENG-3", "ENG-9"],
			request,
			log: (line) => logs.push(line),
		});

		assert.deepEqual(flagged, ["ENG-1", "PROD-466"]);
		assert.deepEqual(logs, [
			"::warning::ENG-9: could not read its labels (Entity not found), so it stays in the release",
		]);
	});
});

describe("unlinkFlaggedIssues", () => {
	it("removes every flagged ticket the release picked up, including ones found through branches", async () => {
		const calls = [];
		const request = async (query, variables) => {
			calls.push(variables);
			if (query.includes("ReleaseIssues")) {
				return {
					release: {
						issues: {
							nodes: [
								{ id: "u1", identifier: "ENG-1", labels: { nodes: [{ name: "feature flag" }] } },
								{ id: "u2", identifier: "ENG-2", labels: { nodes: [{ name: "flag" }] } },
							],
						},
					},
				};
			}
			return { issueToReleaseDeleteByIssueAndRelease: { success: true } };
		};
		const logs = [];

		const removed = await unlinkFlaggedIssues({
			releaseId: "r1",
			request,
			log: (line) => logs.push(line),
		});

		assert.deepEqual(removed, ["ENG-1"]);
		assert.deepEqual(calls, [{ id: "r1" }, { releaseId: "r1", issueId: "u1" }]);
		assert.deepEqual(logs, ["ENG-1: behind a feature flag, removed from the release"]);
		assert.deepEqual(
			await unlinkFlaggedIssues({ releaseId: "r2", request: async () => ({ release: null }) }),
			[],
		);
	});
});

describe("linearClientFromEnv", () => {
	it("needs the app credentials", async () => {
		assert.equal(await linearClientFromEnv({}), null);
	});
});

describe("linkIssues", () => {
	it("adds every released ticket the release doesn't have yet, by its Linear ID", async () => {
		const calls = [];
		const issues = { "ENG-1": "u1", "PROD-493": "u41", "ENG-2": "u2" };
		const request = async (query, variables) => {
			calls.push([query.match(/(ReleaseIssues|IssueId|Link)/)[1], variables]);
			if (query.includes("ReleaseIssues")) {
				return { release: { issues: { nodes: [{ id: "u2", identifier: "ENG-2", labels: { nodes: [] } }] } } };
			}
			if (query.includes("IssueId")) {
				if (variables.id === "ENG-9") throw new Error("Entity not found");
				const id = issues[variables.id];
				return { issue: id ? { id, identifier: variables.id === "PROD-493" ? "ENG-5841" : variables.id } : null };
			}
			return { issueToReleaseCreate: { success: true } };
		};
		const logs = [];

		const added = await linkIssues({
			releaseId: "r1",
			ids: ["ENG-1", "PROD-493", "ENG-2", "ENG-3", "ENG-9", "ENG-1"],
			request,
			log: (line) => logs.push(line),
		});

		assert.deepEqual(added, ["ENG-1", "ENG-5841"]);
		assert.deepEqual(
			calls.filter(([name]) => name === "Link").map(([, variables]) => variables),
			[
				{ releaseId: "r1", issueId: "u1" },
				{ releaseId: "r1", issueId: "u41" },
			],
		);
		assert.deepEqual(logs, [
			"ENG-1: added to the release",
			"ENG-5841: added to the release",
			"::warning::ENG-9: not added to the release (Entity not found)",
		]);
	});

	it("handles a release that can't be found", async () => {
		const added = await linkIssues({
			releaseId: "r1",
			ids: [],
			request: async () => ({ release: null }),
		});
		assert.deepEqual(added, []);
	});
});
