import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildChangelog,
	issueSubjectPattern,
	linearIssuesIn,
	parseCommitLog,
	previousStableTag,
	withoutFlaggedWork,
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

describe("buildChangelog", () => {
	it("groups commits by type and lists the Linear issues", () => {
		const notes = buildChangelog({
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
		const notes = buildChangelog({
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

describe("feature-flagged work", () => {
	const commits = [
		{ sha: "aaaaaaa1", subject: "feat(map): demographics (ENG-1)", body: "" },
		{ sha: "bbbbbbb2", subject: "fix(map): panel (ENG-2)", body: "" },
		{ sha: "ccccccc3", subject: "feat(map): both (ENG-1, ENG-3)", body: "" },
		{ sha: "ddddddd4", subject: "chore: deps", body: "" },
	];

	it("drops commits that only reference flagged tickets", () => {
		assert.deepEqual(
			withoutFlaggedWork(commits, ["ENG-1"]).map((commit) => commit.sha),
			["bbbbbbb2", "ccccccc3", "ddddddd4"],
		);
		assert.equal(withoutFlaggedWork(commits, []).length, 4);
	});

	it("leaves flagged tickets out of the changelog and the Linear issues list", () => {
		const notes = buildChangelog({
			tag: "v1.1.0",
			previousTag: "v1.0.0",
			date: "2026-10-02",
			repoUrl: REPO,
			commits,
			flagged: ["ENG-1"],
		});

		assert.ok(!notes.includes("demographics"));
		assert.ok(notes.includes("feat(map): both (ENG-1, ENG-3)"));
		assert.ok(notes.includes("- ENG-2"));
		assert.ok(notes.includes("- ENG-3"));
		assert.ok(!notes.includes("- ENG-1"));
	});
});

describe("issueSubjectPattern", () => {
	it("matches only the released tickets, so flagged ones and merge commits are skipped", () => {
		const pattern = new RegExp(issueSubjectPattern(["ENG-2", "REQ-9"]));

		assert.equal(issueSubjectPattern(["ENG-2", "REQ-9"]), "\\b(ENG-2|REQ-9)\\b");
		assert.equal(pattern.exec("fix(map): panel (ENG-2)")?.[1], "ENG-2");
		assert.equal(pattern.test("feat(map): demographics (ENG-1)"), false);
		assert.equal(pattern.test("Merge pull request #96 from acme/feature/eng-2-panel"), false);
		assert.equal(new RegExp(issueSubjectPattern([])).test("feat: anything (ENG-1)"), false);
		assert.match(issueSubjectPattern([]), /\(.*\)/, "Linear's CLI requires capture group 1");
	});
});
