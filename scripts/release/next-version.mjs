import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const BUMP_COMMIT_PREFIX = "ci: bump new version";

const MAJOR_PATTERN = /^\w+(\([^)]*\))?!:|BREAKING CHANGE/;
const MINOR_PATTERN = /^(feat|feature)(\([^)]*\))?:|\bfrom [^\s]+\/feature\//;
const PATCH_PATTERN = /^(fix|hotfix)(\([^)]*\))?:|\bfrom [^\s]+\/hotfix\//;
const STABLE_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/;
const CANDIDATE_TAG_PATTERN = /^v(\d+\.\d+\.\d+)-rc\.\d+$/;

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

function compareVersions(left, right) {
	return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

export function latestCandidateVersion(existingTags, lastStableTag) {
	const stable = parseVersion(lastStableTag);
	const candidates = existingTags
		.map((tag) => CANDIDATE_TAG_PATTERN.exec(tag)?.[1])
		.filter(Boolean)
		.map((version) => parseVersion(`v${version}`))
		.filter((version) => compareVersions(version, stable) > 0)
		.sort(compareVersions);
	return candidates.at(-1) ?? null;
}

export function planRelease({ lastStableTag, subjects, channel, existingTags }) {
	const current = parseVersion(lastStableTag);
	const candidate = channel === "production" ? latestCandidateVersion(existingTags, lastStableTag) : null;
	const next = candidate ?? bumpVersion(current, subjects);
	const version = formatVersion(next);
	if (version === formatVersion(current)) return { bumped: false, version: null, tag: null };
	if (channel === "production") return { bumped: true, version, tag: `v${version}` };

	const candidates = existingTags.filter((tag) => tag.startsWith(`v${version}-rc.`));
	const prerelease = `${version}-rc.${candidates.length + 1}`;
	return { bumped: true, version: prerelease, tag: `v${prerelease}` };
}

function git(...args) {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function lines(output) {
	return output.split("\n").filter(Boolean);
}

export function readGitState() {
	const tags = lines(git("tag", "--list", "v*"));
	const stable = tags
		.filter((tag) => STABLE_TAG_PATTERN.test(tag))
		.sort((a, b) => compareVersions(parseVersion(a), parseVersion(b)));
	const lastStableTag = stable.at(-1) ?? null;
	const range = lastStableTag ? `${lastStableTag}..HEAD` : "HEAD";
	return {
		lastStableTag,
		existingTags: tags,
		subjects: lines(git("log", range, "--first-parent", "--format=%s")),
	};
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const channel = process.argv.includes("--channel=staging") ? "staging" : "production";
	process.stdout.write(`${JSON.stringify(planRelease({ ...readGitState(), channel }))}\n`);
}
