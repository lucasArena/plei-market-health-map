import { pathToFileURL } from "node:url";
import { git, lines } from "./next-version.mjs";

export const RELEASE_BRANCH_PATTERN = /^release\/(\d{4}-\d{2}-\d{2})-(\d+)$/;

export function nextReleaseBranch(date, existing) {
	const taken = existing
		.map((branch) => RELEASE_BRANCH_PATTERN.exec(branch))
		.filter((match) => match?.[1] === date)
		.map((match) => Number(match?.[2]));
	return `release/${date}-${Math.max(0, ...taken) + 1}`;
}

export function remoteReleaseBranches(output) {
	return lines(output).map((line) => line.split("refs/heads/")[1] ?? "");
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isCli) {
	const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
	git("fetch", "origin", "staging");
	const branch = nextReleaseBranch(
		date,
		remoteReleaseBranches(git("ls-remote", "--heads", "origin", "release/*")),
	);
	git("push", "origin", `origin/staging:refs/heads/${branch}`);
	process.stdout.write(`${branch}\n`);
}
