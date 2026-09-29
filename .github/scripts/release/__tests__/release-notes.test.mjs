import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildReleaseNotes,
	linearIssuesIn,
	parseCommitLog,
	previousStableTag,
} from "../release-notes.mjs";

const REPO = "https://github.com/acme/app";

describe("previousStableTag", () => {
	it("picks the closest stable tag below the release", () => {
		const tags = ["v0.2.1", "v0.2.1-rc.1", "v0.3.0", "v0.10.0", "latest"];
		assert.equal(previousStableTag(tags, "v0.10.0"), "v0.3.0");
		assert.equal(previousStableTag(tags, "v0.3.0"), "v0.2.1");
		assert.equal(previousStableTag(tags, "v0.2.1"), null);
	});
});

describe("parseCommitLog", () => {
	it("reads sha, subject and body and drops version bump commits", () => {
		const log = [
			"aaa\u001ffeat(map): panel (PROD-451)\u001fCloses PROD-452\u001e",
			"\nbbb\u001fci: bump new version v0.3.0 [skip ci]\u001f\u001e",
			"\nccc\u001ffix: tooltip\u001f\u001e\n",
		].join("");
		assert.deepEqual(parseCommitLog(log), [
			{ sha: "aaa", subject: "feat(map): panel (PROD-451)", body: "Closes PROD-452" },
			{ sha: "ccc", subject: "fix: tooltip", body: "" },
		]);
	});
});

describe("linearIssuesIn", () => {
	it("collects unique issue ids from subjects and bodies", () => {
		const commits = [
			{ sha: "a", subject: "feat: x (PROD-451)", body: "Refs PROD-12 and ENG-7" },
			{ sha: "b", subject: "fix: y PROD-451", body: "utf-8 and v0-1 are not issues" },
		];
		assert.deepEqual(linearIssuesIn(commits), ["ENG-7", "PROD-12", "PROD-451"]);
	});
});

describe("buildReleaseNotes", () => {
	it("groups commits by type and lists the Linear issues", () => {
		const notes = buildReleaseNotes({
			tag: "v0.4.0",
			previousTag: "v0.3.0",
			date: "2026-09-29",
			repoUrl: REPO,
			commits: [
				{ sha: "a01b8e0aaaaaaa", subject: "feat(map): facility panel (PROD-451)", body: "" },
				{ sha: "b22c9f1bbbbbbb", subject: "fix: tooltip", body: "" },
				{ sha: "c33d0a2ccccccc", subject: "chore: deps", body: "" },
				{ sha: "d44e1b3ddddddd", subject: "feat!: drop v1", body: "" },
			],
		});
		assert.equal(
			notes,
			[
				"# Market Health Map v0.4.0",
				"",
				`Released 2026-09-29 · [v0.3.0...v0.4.0](${REPO}/compare/v0.3.0...v0.4.0)`,
				"",
				"## Breaking changes",
				"",
				`- feat!: drop v1 ([d44e1b3](${REPO}/commit/d44e1b3ddddddd))`,
				"",
				"## Features",
				"",
				`- feat(map): facility panel (PROD-451) ([a01b8e0](${REPO}/commit/a01b8e0aaaaaaa))`,
				"",
				"## Fixes",
				"",
				`- fix: tooltip ([b22c9f1](${REPO}/commit/b22c9f1bbbbbbb))`,
				"",
				"## Other changes",
				"",
				`- chore: deps ([c33d0a2](${REPO}/commit/c33d0a2ccccccc))`,
				"",
				"## Linear issues",
				"",
				"- PROD-451",
				"",
			].join("\n"),
		);
	});

	it("handles a first release with no changes or issues", () => {
		const notes = buildReleaseNotes({
			tag: "v0.1.0",
			previousTag: null,
			date: "2026-09-29",
			repoUrl: REPO,
			commits: [],
		});
		assert.match(notes, /\[v0\.1\.0\]\(https:\/\/github\.com\/acme\/app\/tree\/v0\.1\.0\)/);
		assert.match(notes, /No changes since the last release\./);
		assert.match(notes, /No Linear issues were referenced in these commits\./);
	});
});
