import type { FacilityDetailView } from "@market-health-map/application";
import type { LlmMessage } from "@/lib/ai/browser-llm.types";

const DAY_MS = 86_400_000;

const LANGUAGE_BY_LOCALE: Record<string, string> = {
	en: "English",
	"pt-BR": "Brazilian Portuguese",
};

const EXAMPLE_FACTS = [
	"Facility: Riverside Arena.",
	"Pickup games played in the last 28 days (Aug 3 to Aug 30, 2026): 86.",
];

const EXAMPLE_SUMMARY_BY_LOCALE: Record<string, string> = {
	en: "Riverside Arena played 86 pickup games in the last 28 days, from Aug 3 to Aug 30, 2026.",
	"pt-BR":
		"A Riverside Arena teve 86 jogos realizados nos últimos 28 dias, de 3 a 30 de ago. de 2026.",
};

function shiftedDay(isoDate: string, days: number, locale: string, withYear: boolean): string {
	const date = new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS);
	return new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
		year: withYear ? "numeric" : undefined,
		timeZone: "UTC",
	}).format(date);
}

export function buildFacilitySummaryMessages(
	{ facility, stats }: FacilityDetailView,
	locale: string,
): LlmMessage[] {
	const language = LANGUAGE_BY_LOCALE[locale] ?? "English";
	const exampleSummary = EXAMPLE_SUMMARY_BY_LOCALE[locale] ?? EXAMPLE_SUMMARY_BY_LOCALE.en;
	const start = shiftedDay(stats.weekStart, -21, locale, false);
	const end = shiftedDay(stats.weekStart, 6, locale, true);
	const facts = [
		`Facility: ${facility.name}.`,
		`Pickup games played in the last 28 days (${start} to ${end}): ${stats.playedLast28Days}.`,
	];
	return [
		{
			role: "system",
			content: `You summarize how many pickup soccer games a facility played in the last 28 days for Plei's operations team. Write one plain sentence in ${language}. Use only the facts given and never add information, adjectives, comparisons or causes. No lists, headings or markdown.`,
		},
		{ role: "user", content: `Facts:\n${EXAMPLE_FACTS.join("\n")}` },
		{ role: "assistant", content: exampleSummary ?? "" },
		{
			role: "user",
			content: `Facts:\n${facts.join("\n")}\n\nWrite the summary in ${language}.`,
		},
	];
}
