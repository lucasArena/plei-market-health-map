import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const BUMP_COMMIT_PREFIX = "ci: bump new version";

const MAJOR_PATTERN = /^\w+(\([^)]*\))?!:|BREAKING CHANGE/;
const MINOR_PATTERN = /^(feat|feature)(\([^)]*\))?:/;
const PATCH_PATTERN = /^(fix|hotfix)(\([^)]*\))?:/;
export const STABLE_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;
export const PROMOTION_PATTERN = /^chore\(release\): promote staging to production/;

const SQUASHED_COMMIT_PATTERN = /^\* (.+)$/;
const FIELD_SEPARATOR = "\u001f";
const RECORD_SEPARATOR = "\u001e";

export function classifyCommit(subject) {
	if (subject.startsWith(BUMP_COMMIT_PREFIX)) return "none";
	if (MAJOR_PATTERN.test(subject)) return "major";
	if (MINOR_PATTERN.test(subject)) return "minor";
	if (PATCH_PATTERN.test(subject)) return "patch";
	return "none";
}

export function parseVersion(tag) {
	const match = STABLE_TAG_PATTERN.exec(tag ?? "");
	if (!match) return { major: 0, minor: 0, patch: 0 };
	return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function compareVersions(left, right) {
	return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

export function bumpVersion(current, subjects) {
	const counts = { major: 0, minor: 0, patch: 0, none: 0 };
	for (const subject of subjects) counts[classifyCommit(subject)] += 1;

	if (counts.major > 0) return { major: current.major + counts.major, minor: 0, patch: 0 };
	if (counts.minor > 0) {
		return { major: current.major, minor: current.minor + counts.minor, patch: counts.patch };
	}
	return { major: current.major, minor: current.minor, patch: current.patch + counts.patch };
}

export function formatVersion({ major, minor, patch }) {
	return `${major}.${minor}.${patch}`;
}

export function planRelease({ lastStableTag, subjects }) {
	const current = parseVersion(lastStableTag);
	const version = formatVersion(bumpVersion(current, subjects));
	if (version === formatVersion(current)) return { bumped: false, version: null, tag: null };
	return { bumped: true, version, tag: `v${version}` };
}

export function git(...args) {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

export function lines(output) {
	return output.split("\n").filter(Boolean);
}

export function releaseSubjects(commits) {
	return commits.flatMap(({ subject, body }) => {
		if (!PROMOTION_PATTERN.test(subject)) return [subject];
		const squashed = lines(body ?? "")
			.map((line) => SQUASHED_COMMIT_PATTERN.exec(line.trim())?.[1])
			.filter(Boolean);
		return squashed.length > 0 ? squashed : [subject];
	});
}

export function parseSubjectsAndBodies(output) {
	return output
		.split(RECORD_SEPARATOR)
		.map((record) => record.trim())
		.filter(Boolean)
		.map((record) => {
			const [subject = "", body = ""] = record.split(FIELD_SEPARATOR);
			return { subject: subject.trim(), body };
		});
}

export function readGitState() {
	const stable = lines(git("tag", "--list", "v*"))
		.filter((tag) => STABLE_TAG_PATTERN.test(tag))
		.sort((a, b) => compareVersions(parseVersion(a), parseVersion(b)));
	const lastStableTag = stable.at(-1) ?? null;
	const range = lastStableTag ? `${lastStableTag}..HEAD` : "HEAD";
	const log = git("log", range, "--no-merges", `--format=%s${FIELD_SEPARATOR}%b${RECORD_SEPARATOR}`);
	return { lastStableTag, subjects: releaseSubjects(parseSubjectsAndBodies(log)) };
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	process.stdout.write(`${JSON.stringify(planRelease(readGitState()))}\n`);
}
