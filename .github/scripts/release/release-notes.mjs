import { writeFileSync } from "node:fs";
import { flaggedIssueIds, linearClientFromEnv } from "../linear/flagged-issues.mjs";
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
export const LINEAR_ISSUE_URL = "https://linear.app/plei/issue";

const CONVENTIONAL_PREFIX = /^\w+(\([^)]*\))?!?:\s*/;
const TRAILING_REFERENCES = /(\s*\((#\d+|[A-Z][A-Z0-9]{1,9}-\d+(,\s*[A-Z][A-Z0-9]{1,9}-\d+)*)\))+\s*$/;

const FIELD_SEPARATOR = "\u001f";
const RECORD_SEPARATOR = "\u001e";

const NOTE_SECTIONS = [
	["major", "Breaking changes"],
	["minor", "Features"],
	["patch", "Fixes"],
];

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

export function withoutFlaggedWork(commits, flagged) {
	const flaggedIds = new Set(flagged);
	return commits.filter((commit) => {
		const ids = `${commit.subject}\n${commit.body}`.match(LINEAR_ISSUE_PATTERN) ?? [];
		return ids.length === 0 || ids.some((id) => !flaggedIds.has(id));
	});
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

export function describeCommit(subject) {
	const description = subject.replace(CONVENTIONAL_PREFIX, "").replace(TRAILING_REFERENCES, "").trim();
	const sentence = description.charAt(0).toUpperCase() + description.slice(1);
	return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function issueLinks(ids) {
	return ids.map((id) => `[${id}](${LINEAR_ISSUE_URL}/${id})`).join(", ");
}

export function buildReleaseNotes({ commits: allCommits, flagged = [] }) {
	const commits = withoutFlaggedWork(allCommits, flagged).toReversed();
	const listed = new Set();
	const sections = NOTE_SECTIONS.flatMap(([kind, title]) => {
		const notes = commits.flatMap((commit) => {
			if (classifyCommit(commit.subject) !== kind) return [];
			const ids = linearIssuesIn([commit]).filter((id) => !flagged.includes(id));
			const fresh = ids.filter((id) => !listed.has(id));
			if (ids.length > 0 && fresh.length === 0) return [];
			for (const id of fresh) listed.add(id);
			const links = fresh.length > 0 ? ` (${issueLinks(fresh)})` : "";
			return [`* ${describeCommit(commit.subject)}${links}`];
		});
		return notes.length === 0 ? [] : [`## ${title}`, "", ...notes, ""];
	});
	const body = sections.length === 0 ? ["No user-facing changes in this release."] : sections;
	return body.join("\n").trimEnd().concat("\n");
}

export function buildChangelog({ tag, previousTag, date, repoUrl, commits: allCommits, flagged = [] }) {
	const commits = withoutFlaggedWork(allCommits, flagged);
	const range = previousTag
		? `[${previousTag}...${tag}](${repoUrl}/compare/${previousTag}...${tag})`
		: `[${tag}](${repoUrl}/tree/${tag})`;
	const sections = SECTIONS.flatMap(([kind, title]) => {
		const matching = commits.filter((commit) => classifyCommit(commit.subject) === kind);
		if (matching.length === 0) return [];
		return [`## ${title}`, "", ...matching.map((commit) => commitLine(commit, repoUrl)), ""];
	});
	const issues = linearIssuesIn(commits).filter((id) => !flagged.includes(id));
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
	const [tag, notesPath = "release-notes.md", changelogPath = "changelog.md"] =
		process.argv.slice(2);
	if (!tag) {
		throw new Error(
			"Usage: node .github/scripts/release/release-notes.mjs <tag> [release-notes.md] [changelog.md]",
		);
	}
	const { previousTag, commits } = readReleaseCommits(tag);
	const referenced = linearIssuesIn(commits);
	let flagged = [];
	try {
		const request = await linearClientFromEnv();
		if (request) flagged = await flaggedIssueIds({ ids: referenced, request, log: console.error });
	} catch (error) {
		console.error(`::warning::Could not check for feature-flagged tickets (${error.message}).`);
	}
	const repoUrl = `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${process.env.GITHUB_REPOSITORY ?? "lucasArena/plei-market-health-map"}`;
	const date = new Date().toISOString().slice(0, 10);
	writeFileSync(notesPath, buildReleaseNotes({ commits, flagged }));
	writeFileSync(
		changelogPath,
		buildChangelog({ tag, previousTag, date, repoUrl, commits, flagged }),
	);
	const issues = referenced.filter((id) => !flagged.includes(id));
	process.stdout.write(
		`${JSON.stringify({ previousTag, issues, flagged, commits: commits.length })}\n`,
	);
}
