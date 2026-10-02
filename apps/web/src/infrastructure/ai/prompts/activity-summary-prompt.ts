import type { LlmMessage } from "@/infrastructure/ai/browser-llm/browser-llm.types";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";

const DEFAULT_LANGUAGE = "English";
const DEFAULT_EXAMPLE_SUMMARY =
	"- New player activation fell 29% versus the previous 28 days, while games fell 10%.\n- Activation is weakening faster than game activity; investigate the gap.";

export class ActivitySummaryPrompt {
	private static readonly LANGUAGE_BY_LOCALE: Record<string, string> = {
		en: "English",
		"pt-BR": "Brazilian Portuguese",
		es: "Spanish",
	};

	private static readonly EXAMPLE_FACTS = [
		"Facility: Riverside Arena.",
		"Period: the last 28 days (Aug 3 to Aug 30, 2026), compared with the previous 28 days.",
		"Pickup games played: 96 → 86, down 10% from the previous 28 days.",
		"Unique players: 120 → 126, up 5% from the previous 28 days.",
		"Newly activated players: 34 → 24, down 29% from the previous 28 days.",
		"Confirmation rate: 84%, up 2 percentage points from the previous 28 days.",
	];

	private static readonly EXAMPLE_SUMMARY_BY_LOCALE: Record<string, string> = {
		en: DEFAULT_EXAMPLE_SUMMARY,
		"pt-BR":
			"- A ativação de novos jogadores caiu 29% em relação aos 28 dias anteriores, enquanto os jogos caíram 10%.\n- A ativação está enfraquecendo mais rapidamente; investigue essa diferença.",
		es: "- La activación de nuevos jugadores cayó 29% frente a los 28 días anteriores, mientras que los partidos cayeron 10%.\n- La activación se está debilitando más rápido que la actividad de partidos; investiguen esa diferencia.",
	};

	build(subject: ActivitySummarySubject, locale: string): LlmMessage[] {
		const language = this.languageFor(locale);
		return [
			{ role: "system", content: this.instructions(language) },
			{ role: "user", content: this.factsMessage(ActivitySummaryPrompt.EXAMPLE_FACTS) },
			{ role: "assistant", content: this.exampleSummaryFor(locale) },
			{
				role: "user",
				content: `${this.factsMessage(this.factsFor(subject, locale))}\n\nWrite the key insights in ${language}.`,
			},
		];
	}

	private instructions(language: string): string {
		return `Identify the most useful signals in the last 28 days for Plei's operations team. Write 2–3 short bullet points in ${language}. Write one bullet per metric line that has a change, keeping its exact number and its direction word (up or down); never move a number to another metric. Lead with the strongest change, then explain a divergence between activation, players, games or confirmation when supported. Include the comparison period and supporting numbers, not a recap of scorecards or busiest times. Suggest what to investigate without inventing causes. A zero previous count means no percentage baseline, not infinite growth. Small counts are weak evidence. Four weekly points and one previous period cannot establish historical normality, seasonality or a statistical anomaly; never claim unusual or more-than-normal activity. If changes are flat or unavailable, say there is no clear signal in the available comparisons. Use only supplied facts. For markets, write a plain overall-change opening paragraph, followed by contributor bullets. All markets names markets only; a selected market names facilities only. Preserve the supplied contributors and their counts. Use one bullet per line, starting with "- ". No headings or other markdown.`;
	}

	private direction(value: number, unit: string): string {
		if (value === 0) return "unchanged from the previous 28 days";
		const word = value > 0 ? "up" : "down";
		return `${word} ${Math.abs(value)}${unit} from the previous 28 days`;
	}

	private metricFact(
		name: string,
		previous: number,
		current: number,
		changePercent: number | null,
	): string {
		const change =
			changePercent === null
				? "no previous baseline, so no percentage"
				: this.direction(changePercent, "%");
		return `${name}: ${previous} → ${current}, ${change}.`;
	}

	private confirmationFact(rate: number | null, changePoints: number | null): string {
		if (rate === null) return "Confirmation rate: unavailable.";
		const change =
			changePoints === null
				? "no previous rate to compare"
				: this.direction(changePoints, " percentage points");
		return `Confirmation rate: ${rate}%, ${change}.`;
	}

	private subjectFact({ kind, name }: ActivitySummarySubject): string {
		return {
			facility: `Facility: ${name}.`,
			market: `Market: ${name}.`,
			"all-markets": "Scope: all Plei markets.",
		}[kind];
	}

	private scopeFacts({ kind, scope }: ActivitySummarySubject): string[] {
		if (!scope) return [];
		const facilities = `Active facilities: ${scope.activeFacilityCount} of ${scope.facilityCount}.`;
		if (kind !== "all-markets") return [facilities];
		return [facilities, `Active markets: ${scope.activeMarketCount} of ${scope.marketCount}.`];
	}

	private factsFor(subject: ActivitySummarySubject, locale: string): string[] {
		const { stats } = subject;
		const start = this.formatDay(stats.periodStart, locale, false);
		const end = this.formatDay(stats.periodEnd, locale, true);
		return [
			this.subjectFact(subject),
			...this.scopeFacts(subject),
			...(subject.insightFacts
				? [
						`Largest contributors to the games change (preserve their names and counts): ${subject.insightFacts}`,
					]
				: []),
			`Period: the last 28 days (${start} to ${end}), compared with the previous 28 days.`,
			this.metricFact(
				"Pickup games played",
				stats.playedPrevious28Days,
				stats.playedLast28Days,
				stats.playedPeriodChangePercent,
			),
			this.metricFact(
				"Unique players",
				stats.uniquePlayersPrevious28Days,
				stats.uniquePlayersLast28Days,
				stats.uniquePlayersPeriodChangePercent,
			),
			this.metricFact(
				"Newly activated players",
				stats.activatedPlayersPrevious28Days,
				stats.activatedPlayersLast28Days,
				stats.activatedPlayersPeriodChangePercent,
			),
			this.confirmationFact(stats.confirmationRate, stats.confirmationRateChangePoints),
			`Weekly games (oldest first): ${stats.weeklyActivity.map((week) => `${week.weekStart}: ${week.gamesPlayed}`).join(", ")}.`,
		];
	}

	private factsMessage(facts: string[]): string {
		return `Facts:\n${facts.join("\n")}`;
	}

	private languageFor(locale: string): string {
		return ActivitySummaryPrompt.LANGUAGE_BY_LOCALE[locale] ?? DEFAULT_LANGUAGE;
	}

	private exampleSummaryFor(locale: string): string {
		return ActivitySummaryPrompt.EXAMPLE_SUMMARY_BY_LOCALE[locale] ?? DEFAULT_EXAMPLE_SUMMARY;
	}

	private formatDay(isoDate: string, locale: string, withYear: boolean): string {
		const date = new Date(`${isoDate}T00:00:00Z`);
		return new Intl.DateTimeFormat(locale, {
			month: "short",
			day: "numeric",
			year: withYear ? "numeric" : undefined,
			timeZone: "UTC",
		}).format(date);
	}
}

export const activitySummaryPrompt = new ActivitySummaryPrompt();
