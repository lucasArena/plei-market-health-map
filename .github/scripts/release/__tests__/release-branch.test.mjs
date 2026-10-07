import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	nextReleaseBranch,
	RELEASE_BRANCH_PATTERN,
	remoteReleaseBranches,
} from "../release-branch.mjs";

describe("nextReleaseBranch", () => {
	it("numbers the day's release branches from 1", () => {
		assert.equal(nextReleaseBranch("2026-10-06", []), "release/2026-10-06-1");
		assert.equal(
			nextReleaseBranch("2026-10-06", [
				"release/2026-10-05-4",
				"release/2026-10-06-1",
				"release/2026-10-06-2",
				"release/notes",
			]),
			"release/2026-10-06-3",
		);
	});

	it("reads branch names from git ls-remote and matches only dated release branches", () => {
		assert.deepEqual(
			remoteReleaseBranches("abc123\trefs/heads/release/2026-10-06-1\ndef456\trefs/heads/release/x\n"),
			["release/2026-10-06-1", "release/x"],
		);
		assert.equal(RELEASE_BRANCH_PATTERN.test("release/2026-10-06-12"), true);
		assert.equal(RELEASE_BRANCH_PATTERN.test("release/2026-10-06"), false);
	});
});
