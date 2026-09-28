import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	BUMP_COMMIT_PREFIX,
	bumpVersion,
	classifyCommit,
	formatVersion,
	latestCandidateVersion,
	parseVersion,
	planRelease,
} from "./next-version.mjs";

describe("classifyCommit", () => {
	it("maps commit types and PR branches to bumps", () => {
		assert.equal(classifyCommit("feat(map): clusters"), "minor");
		assert.equal(classifyCommit("feature: login"), "minor");
		assert.equal(classifyCommit("Merge pull request #4 from plei/feature/sso"), "minor");
		assert.equal(classifyCommit("fix: tooltip"), "patch");
		assert.equal(classifyCommit("hotfix(auth): redirect"), "patch");
		assert.equal(classifyCommit("Merge pull request #5 from plei/hotfix/redirect"), "patch");
		assert.equal(classifyCommit("feat!: drop v1 api"), "major");
		assert.equal(classifyCommit("refactor: extract rules"), "none");
		assert.equal(classifyCommit("chore: deps"), "none");
		assert.equal(classifyCommit(`${BUMP_COMMIT_PREFIX} v1.2.3 [skip ci]`), "none");
	});
});

describe("bumpVersion", () => {
	const current = { major: 0, minor: 3, patch: 2 };

	it("adds one patch per hotfix", () => {
		assert.deepEqual(bumpVersion(current, ["fix: a", "hotfix: b"]), { major: 0, minor: 3, patch: 4 });
	});

	it("adds one minor per feature and counts hotfixes on top", () => {
		assert.deepEqual(bumpVersion(current, ["feat: a", "feat: b", "fix: c"]), {
			major: 0,
			minor: 5,
			patch: 1,
		});
	});

	it("bumps the major for breaking changes", () => {
		assert.deepEqual(bumpVersion(current, ["feat!: a", "feat: b"]), { major: 1, minor: 0, patch: 0 });
	});

	it("does not bump for refactors and chores", () => {
		assert.deepEqual(bumpVersion(current, ["refactor: a", "chore: b"]), current);
	});
});

describe("parseVersion and formatVersion", () => {
	it("round-trips stable tags and defaults to 0.0.0", () => {
		assert.equal(formatVersion(parseVersion("v1.12.3")), "1.12.3");
		assert.deepEqual(parseVersion(null), { major: 0, minor: 0, patch: 0 });
		assert.deepEqual(parseVersion("v1.2.3-rc.1"), { major: 0, minor: 0, patch: 0 });
	});
});

describe("planRelease", () => {
	const base = { lastStableTag: "v0.1.1", subjects: ["feat: clusters", "fix: login"], existingTags: [] };

	it("tags a stable version for production", () => {
		assert.deepEqual(planRelease({ ...base, channel: "production" }), {
			bumped: true,
			version: "0.2.1",
			tag: "v0.2.1",
		});
	});

	it("tags the next release candidate for staging", () => {
		assert.deepEqual(
			planRelease({ ...base, channel: "staging", existingTags: ["v0.1.1", "v0.2.1-rc.1"] }),
			{ bumped: true, version: "0.2.1-rc.2", tag: "v0.2.1-rc.2" },
		);
	});

	it("promotes the latest staging candidate to production", () => {
		assert.deepEqual(
			planRelease({
				...base,
				subjects: ["Merge pull request #3 from lucasArena/staging"],
				channel: "production",
				existingTags: ["v0.1.1", "v0.2.0-rc.1", "v0.2.1-rc.1", "v0.2.1-rc.2"],
			}),
			{ bumped: true, version: "0.2.1", tag: "v0.2.1" },
		);
	});

	it("skips the release when nothing bumps", () => {
		assert.deepEqual(planRelease({ ...base, subjects: ["chore: x"], channel: "production" }), {
			bumped: false,
			version: null,
			tag: null,
		});
	});
});

describe("latestCandidateVersion", () => {
	it("ignores candidates at or below the last stable version", () => {
		assert.equal(latestCandidateVersion(["v0.1.1-rc.3", "v0.1.1"], "v0.1.1"), null);
		assert.deepEqual(latestCandidateVersion(["v0.3.0-rc.1", "v0.10.0-rc.1", "v0.2.9"], "v0.2.9"), {
			major: 0,
			minor: 10,
			patch: 0,
		});
	});
});
