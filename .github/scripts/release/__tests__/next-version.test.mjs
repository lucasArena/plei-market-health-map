import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	BUMP_COMMIT_PREFIX,
	bumpVersion,
	classifyCommit,
	formatVersion,
	parseSubjectsAndBodies,
	parseVersion,
	planRelease,
	releaseSubjects,
} from "../next-version.mjs";

describe("classifyCommit", () => {
	it("maps commit types to bumps", () => {
		assert.equal(classifyCommit("feat(map): clusters"), "minor");
		assert.equal(classifyCommit("feature: login"), "minor");
		assert.equal(classifyCommit("fix: tooltip"), "patch");
		assert.equal(classifyCommit("hotfix(auth): redirect"), "patch");
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
	it("round-trips stable tags and ignores anything else", () => {
		assert.equal(formatVersion(parseVersion("v1.12.3")), "1.12.3");
		assert.deepEqual(parseVersion(null), { major: 0, minor: 0, patch: 0 });
		assert.deepEqual(parseVersion("v1.2.3-rc.1"), { major: 0, minor: 0, patch: 0 });
	});
});

describe("planRelease", () => {
	it("tags the next production version", () => {
		assert.deepEqual(
			planRelease({ lastStableTag: "v0.1.1", subjects: ["feat: clusters", "fix: login", "chore: x"] }),
			{ bumped: true, version: "0.2.1", tag: "v0.2.1" },
		);
	});

	it("skips the release when nothing bumps", () => {
		assert.deepEqual(planRelease({ lastStableTag: "v0.1.1", subjects: ["chore: x"] }), {
			bumped: false,
			version: null,
			tag: null,
		});
	});
});

describe("releaseSubjects", () => {
	it("counts the commits listed inside a squashed promotion", () => {
		const promotion = {
			subject: "chore(release): promote staging to production (ENG-5785) (#44)",
			body: "* feat(metrics): add App metrics (#43)\n\n* fix(map): one side panel (#34)\n\nCo-authored-by: someone",
		};
		const subjects = releaseSubjects([promotion, { subject: "docs: readme", body: "" }]);

		assert.deepEqual(subjects, ["feat(metrics): add App metrics (#43)", "fix(map): one side panel (#34)", "docs: readme"]);
		assert.deepEqual(planRelease({ lastStableTag: "v0.6.2", subjects }), {
			bumped: true,
			version: "0.7.1",
			tag: "v0.7.1",
		});
	});

	it("keeps a promotion without a commit list as it is", () => {
		assert.deepEqual(
			releaseSubjects([{ subject: "chore(release): promote staging to production", body: "" }]),
			["chore(release): promote staging to production"],
		);
	});

	it("parses subjects and bodies from the git log format", () => {
		assert.deepEqual(parseSubjectsAndBodies("feat: a\u001fbody a\u001e\nfix: b\u001f\u001e\n"), [
			{ subject: "feat: a", body: "body a" },
			{ subject: "fix: b", body: "" },
		]);
	});
});
