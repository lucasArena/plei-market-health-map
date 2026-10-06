import type {
	ChangeDirection,
	InsightChecks,
	MetricCheck,
} from "@/infrastructure/ai/insight-check/insight-check.types";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";

const PERCENT_PATTERN =
	/(\d+(?:[.,]\d+)?)\s*(?:%|percentage points?|pontos percentuais|puntos porcentuales|pts?\b)/gi;
const UP_PATTERN =
	/\b(up|increas\w*|rose|ris\w*|grew|grow\w*|gain\w*|aument\w*|subi\w*|cresc\w*|creci\w*)\b/i;
const DOWN_PATTERN =
	/\b(down|decreas\w*|fell|fall\w*|declin\w*|drop\w*|lower|caiu|cayó|baj\w*|disminu\w*|redu\w*|queda|caída)\b/i;
const TOLERANCE = 0.05;

export function percentsIn(text: string): number[] {
	return [...text.matchAll(PERCENT_PATTERN)].map(([, value = ""]) =>
		Number(value.replace(",", ".")),
	);
}

function same(a: number, b: number): boolean {
	return Math.abs(a - b) <= TOLERANCE;
}

export function directionIn(line: string): ChangeDirection | null {
	const up = UP_PATTERN.exec(line)?.index ?? Number.POSITIVE_INFINITY;
	const down = DOWN_PATTERN.exec(line)?.index ?? Number.POSITIVE_INFINITY;
	if (up === down) return null;
	return up < down ? "up" : "down";
}

export function buildInsightChecks({ stats, insightFacts }: ActivitySummarySubject): InsightChecks {
	return {
		metrics: [
			{ pattern: /activa?t|ativad/i, change: stats.activatedPlayersChangePercent },
			{ pattern: /unique|únic|unic/i, change: stats.uniquePlayersChangePercent },
			{ pattern: /confirm/i, change: stats.confirmationRateChangePoints },
			{ pattern: /\bgames?\b|jogos|partidos/i, change: stats.playedChangePercent },
		],
		contributorPercents: insightFacts ? percentsIn(insightFacts) : [],
	};
}

function knownChanges(checks: InsightChecks): number[] {
	return [
		...checks.metrics.flatMap((metric) =>
			metric.change === null ? [] : [Math.abs(metric.change)],
		),
		...checks.contributorPercents,
	];
}

function metricOf(line: string, metrics: MetricCheck[]): MetricCheck | undefined {
	return metrics.find((metric) => metric.pattern.test(line));
}

export function isSupportedLine(line: string, checks: InsightChecks): boolean {
	const percents = percentsIn(line);
	if (percents.length === 0) return true;
	const known = knownChanges(checks);
	if (!percents.every((percent) => known.some((value) => same(percent, value)))) return false;
	const metric = metricOf(line, checks.metrics);
	const isGamesLine = metric === undefined || metric === checks.metrics.at(-1);
	const quotesContributor = percents.some((percent) =>
		checks.contributorPercents.some((value) => same(percent, value)),
	);
	if (quotesContributor) return isGamesLine;
	if (!metric || metric.change === null) return true;
	const own = Math.abs(metric.change);
	if (!percents.some((percent) => same(percent, own))) return false;
	if (metric.change === 0) return true;
	const direction = directionIn(line);
	return direction === null || direction === (metric.change > 0 ? "up" : "down");
}

export function supportedInsightText(text: string, checks: InsightChecks): string {
	return text
		.split("\n")
		.filter((line) => isSupportedLine(line, checks))
		.join("\n")
		.trim();
}
