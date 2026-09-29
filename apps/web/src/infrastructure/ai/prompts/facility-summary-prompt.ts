import type { FacilityDetailView } from "@market-health-map/core/application";
import type { LlmMessage } from "@/infrastructure/ai/browser-llm/browser-llm.types";

const DAY_MS = 86_400_000;
const DEFAULT_LANGUAGE = "English";
const DEFAULT_EXAMPLE_SUMMARY =
	"Riverside Arena played 86 pickup games in the last 28 days, from Aug 3 to Aug 30, 2026.";

export class FacilitySummaryPrompt {
	private static readonly LANGUAGE_BY_LOCALE: Record<string, string> = {
		en: "English",
		"pt-BR": "Brazilian Portuguese",
	};

	private static readonly EXAMPLE_FACTS = [
		"Facility: Riverside Arena.",
		"Pickup games played in the last 28 days (Aug 3 to Aug 30, 2026): 86.",
	];

	private static readonly EXAMPLE_SUMMARY_BY_LOCALE: Record<string, string> = {
		en: DEFAULT_EXAMPLE_SUMMARY,
		"pt-BR":
			"A Riverside Arena teve 86 jogos realizados nos últimos 28 dias, de 3 a 30 de ago. de 2026.",
	};

	build(detail: FacilityDetailView, locale: string): LlmMessage[] {
		const language = this.languageFor(locale);
		return [
			{ role: "system", content: this.instructions(language) },
			{ role: "user", content: this.factsMessage(FacilitySummaryPrompt.EXAMPLE_FACTS) },
			{ role: "assistant", content: this.exampleSummaryFor(locale) },
			{
				role: "user",
				content: `${this.factsMessage(this.factsFor(detail, locale))}\n\nWrite the summary in ${language}.`,
			},
		];
	}

	private instructions(language: string): string {
		return `You summarize how many pickup soccer games a facility played in the last 28 days for Plei's operations team. Write one plain sentence in ${language}. Use only the facts given and never add information, adjectives, comparisons or causes. No lists, headings or markdown.`;
	}

	private factsFor({ facility, stats }: FacilityDetailView, locale: string): string[] {
		const start = this.formatDay(stats.weekStart, -21, locale, false);
		const end = this.formatDay(stats.weekStart, 6, locale, true);
		return [
			`Facility: ${facility.name}.`,
			`Pickup games played in the last 28 days (${start} to ${end}): ${stats.playedLast28Days}.`,
		];
	}

	private factsMessage(facts: string[]): string {
		return `Facts:\n${facts.join("\n")}`;
	}

	private languageFor(locale: string): string {
		return FacilitySummaryPrompt.LANGUAGE_BY_LOCALE[locale] ?? DEFAULT_LANGUAGE;
	}

	private exampleSummaryFor(locale: string): string {
		return FacilitySummaryPrompt.EXAMPLE_SUMMARY_BY_LOCALE[locale] ?? DEFAULT_EXAMPLE_SUMMARY;
	}

	private formatDay(isoDate: string, days: number, locale: string, withYear: boolean): string {
		const date = new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS);
		return new Intl.DateTimeFormat(locale, {
			month: "short",
			day: "numeric",
			year: withYear ? "numeric" : undefined,
			timeZone: "UTC",
		}).format(date);
	}
}

export const facilitySummaryPrompt = new FacilitySummaryPrompt();
