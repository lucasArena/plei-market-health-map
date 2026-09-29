import type { FacilityDetailView } from "@market-health-map/core/application";
import type { LlmMessage } from "@/infrastructure/ai/browser-llm/browser-llm.types";

const DAY_MS = 86_400_000;
const DEFAULT_LANGUAGE = "English";
const DEFAULT_EXAMPLE_SUMMARY =
	"Riverside Arena played 86 games with an 84% confirmation rate, serving 126 players including 24 newly activated players; Saturday evenings were busiest.";
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_PERIOD_NAMES = ["mornings", "midday", "evenings", "late evenings"];

export class FacilitySummaryPrompt {
	private static readonly LANGUAGE_BY_LOCALE: Record<string, string> = {
		en: "English",
		"pt-BR": "Brazilian Portuguese",
	};

	private static readonly EXAMPLE_FACTS = [
		"Facility: Riverside Arena.",
		"Pickup games played in the last 28 days (Aug 3 to Aug 30, 2026): 86.",
		"Confirmation rate: 84%.",
		"Unique players: 126.",
		"Newly activated players: 24.",
		"Busiest time: Saturday evenings.",
	];

	private static readonly EXAMPLE_SUMMARY_BY_LOCALE: Record<string, string> = {
		en: DEFAULT_EXAMPLE_SUMMARY,
		"pt-BR":
			"A Riverside Arena teve 86 jogos, taxa de confirmação de 84% e 126 jogadores, incluindo 24 novos ativados; as noites de sábado foram o período mais movimentado.",
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
		return `You summarize a pickup soccer facility's activity over the last 28 days for Plei's operations team. Write one concise sentence in ${language} covering the most useful game, confirmation, player and timing signals. Use only the facts given and never add causes. No lists, headings or markdown.`;
	}

	private factsFor({ facility, stats }: FacilityDetailView, locale: string): string[] {
		const start = this.formatDay(stats.weekStart, -21, locale, false);
		const end = this.formatDay(stats.weekStart, 6, locale, true);
		const busiest = stats.popularTimes.reduce(
			(current, cell) => (cell.gamesPlayed > current.gamesPlayed ? cell : current),
			{ dayOfWeek: 1, timePeriod: 0, gamesPlayed: 0 },
		);
		const confirmationRate =
			stats.confirmationRate === null ? "unavailable" : `${stats.confirmationRate}%`;
		const periodChange =
			stats.playedPeriodChangePercent === null
				? "unavailable"
				: `${stats.playedPeriodChangePercent}%`;
		return [
			`Facility: ${facility.name}.`,
			`Pickup games played in the last 28 days (${start} to ${end}): ${stats.playedLast28Days}.`,
			`Confirmation rate: ${confirmationRate}.`,
			`Unique players: ${stats.uniquePlayersLast28Days}.`,
			`Activated players: ${stats.activatedPlayersLast28Days}.`,
			`Change versus the previous 28 days: ${periodChange}.`,
			`Busiest time: ${DAY_NAMES[busiest.dayOfWeek - 1]} ${TIME_PERIOD_NAMES[busiest.timePeriod]}.`,
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
