import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	FLAG_LABEL,
	flaggedIssueIds,
	hasFlagLabel,
	linearClientFromEnv,
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


describe("linearClientFromEnv", () => {
	it("needs the app credentials", async () => {
		assert.equal(await linearClientFromEnv({}), null);
	});
});

