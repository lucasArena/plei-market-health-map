import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
	BUMP_COMMIT_PREFIX,
	STABLE_TAG_PATTERN,
	classifyCommit,
	compareVersions,
	git,
	lines,
	parseVersion,
} from "./next-version.mjs";

export const LINEAR_ISSUE_PATTERN = /\b[A-Z][A-Z0-9]{1,9}-\d+\b/g;

const FIELD_SEPARATOR = "\u001f";
const RECORD_SEPARATOR = "\u001e";

const SECTIONS = [
	["major", "Breaking changes"],
	["minor", "Features"],
	["patch", "Fixes"],
	["none", "Other changes"],
];

export function previousStableTag(tags, tag) {
	const current = parseVersion(tag);
	return (
		tags
			.filter((candidate) => STABLE_TAG_PATTERN.test(candidate))
			.filter((candidate) => compareVersions(parseVersion(candidate), current) < 0)
			.sort((a, b) => compareVersions(parseVersion(a), parseVersion(b)))
			.at(-1) ?? null
	);
}

export function parseCommitLog(output) {
	return output
		.split(RECORD_SEPARATOR)
		.map((record) => record.trim())
		.filter(Boolean)
		.map((record) => {
			const [sha = "", subject = "", body = ""] = record.split(FIELD_SEPARATOR);
			return { sha, subject: subject.trim(), body: body.trim() };
		})
		.filter((commit) => !commit.subject.startsWith(BUMP_COMMIT_PREFIX));
}

export function linearIssuesIn(commits) {
	const ids = commits.flatMap((commit) =>
		`${commit.subject}\n${commit.body}`.match(LINEAR_ISSUE_PATTERN) ?? [],
	);
	return [...new Set(ids)].sort();
}

function commitLine(commit, repoUrl) {
	const shortSha = commit.sha.slice(0, 7);
	return `- ${commit.subject} ([${shortSha}](${repoUrl}/commit/${commit.sha}))`;
}

export function buildReleaseNotes({ tag, previousTag, date, repoUrl, commits }) {
	const range = previousTag
		? `[${previousTag}...${tag}](${repoUrl}/compare/${previousTag}...${tag})`
		: `[${tag}](${repoUrl}/tree/${tag})`;
	const sections = SECTIONS.flatMap(([kind, title]) => {
		const matching = commits.filter((commit) => classifyCommit(commit.subject) === kind);
		if (matching.length === 0) return [];
		return [`## ${title}`, "", ...matching.map((commit) => commitLine(commit, repoUrl)), ""];
	});
	const issues = linearIssuesIn(commits);
	const issueSection =
		issues.length === 0
			? ["## Linear issues", "", "No Linear issues were referenced in these commits.", ""]
			: ["## Linear issues", "", ...issues.map((id) => `- ${id}`), ""];
	const body = commits.length === 0 ? ["No changes since the last release.", ""] : sections;
	return [`# Market Health Map ${tag}`, "", `Released ${date} · ${range}`, "", ...body, ...issueSection]
		.join("\n")
		.trimEnd()
		.concat("\n");
}

export function readReleaseCommits(tag) {
	const previousTag = previousStableTag(lines(git("tag", "--list", "v*")), tag);
	const range = previousTag ? `${previousTag}..${tag}` : tag;
	const log = git(
		"log",
		range,
		"--no-merges",
		`--format=%H${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%b${RECORD_SEPARATOR}`,
	);
	return { previousTag, commits: parseCommitLog(log) };
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const [tag, outputPath = "release-notes.md"] = process.argv.slice(2);
	if (!tag) throw new Error("Usage: node scripts/release/release-notes.mjs <tag> [output.md]");
	const { previousTag, commits } = readReleaseCommits(tag);
	const repoUrl = `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${process.env.GITHUB_REPOSITORY ?? "lucasArena/plei-market-health-map"}`;
	const date = new Date().toISOString().slice(0, 10);
	writeFileSync(outputPath, buildReleaseNotes({ tag, previousTag, date, repoUrl, commits }));
	process.stdout.write(
		`${JSON.stringify({ previousTag, issues: linearIssuesIn(commits), commits: commits.length })}\n`,
	);
}
