import type { LlmMessage } from "@/infrastructure/ai/browser-llm/browser-llm.types";
import type {
	ActivitySummarySubject,
	PromptPeriodTexts,
} from "@/infrastructure/ai/prompts/activity-summary-prompt.types";

const DEFAULT_LANGUAGE = "English";
const DEFAULT_EXAMPLE_SUMMARY =
	"- New player activation fell 29% versus {previous}, while games fell 10%.\n- Activation is weakening faster than game activity; investigate the gap.";

const PERIOD_TEXT: PromptPeriodTexts = {
	week: { current: "last week", previous: "the previous week" },
	month: { current: "the last 28 days", previous: "the previous 28 days" },
};

const EXAMPLE_PREVIOUS_BY_LOCALE: Record<string, PromptPeriodTexts> = {
	"pt-BR": {
		week: { current: "semana passada", previous: "à semana anterior" },
		month: { current: "últimos 28 dias", previous: "aos 28 dias anteriores" },
	},
	es: {
		week: { current: "la semana pasada", previous: "la semana anterior" },
		month: { current: "los últimos 28 días", previous: "los 28 días anteriores" },
	},
};

export class ActivitySummaryPrompt {
	private static readonly LANGUAGE_BY_LOCALE: Record<string, string> = {
		en: "English",
		"pt-BR": "Brazilian Portuguese",
		es: "Spanish",
	};

	private static readonly EXAMPLE_FACTS = [
		"Facility: Riverside Arena.",
		"Period: {current} (Aug 24 to Aug 30, 2026), compared with {previous}.",
		"Pickup games played: 96 → 86, down 10% from {previous}.",
		"Unique players: 120 → 126, up 5% from {previous}.",
		"Newly activated players: 34 → 24, down 29% from {previous}.",
		"Confirmation rate: 84%, up 2 percentage points from {previous}.",
	];

	private static readonly EXAMPLE_SUMMARY_BY_LOCALE: Record<string, string> = {
		en: DEFAULT_EXAMPLE_SUMMARY,
		"pt-BR":
			"- A ativação de novos jogadores caiu 29% em relação {previous}, enquanto os jogos caíram 10%.\n- A ativação está enfraquecendo mais rapidamente; investigue essa diferença.",
		es: "- La activación de nuevos jugadores cayó 29% frente a {previous}, mientras que los partidos cayeron 10%.\n- La activación se está debilitando más rápido que la actividad de partidos; investiguen esa diferencia.",
	};

	build(subject: ActivitySummarySubject, locale: string): LlmMessage[] {
		const language = this.languageFor(locale);
		const { period } = subject.stats;
		const exampleFacts = ActivitySummaryPrompt.EXAMPLE_FACTS.map((fact) =>
			this.withPeriod(fact, PERIOD_TEXT[period].current, PERIOD_TEXT[period].previous),
		);
		return [
			{ role: "system", content: this.instructions(language, PERIOD_TEXT[period].current) },
			{ role: "user", content: this.factsMessage(exampleFacts) },
			{ role: "assistant", content: this.exampleSummaryFor(locale, subject) },
			{
				role: "user",
				content: `${this.factsMessage(this.factsFor(subject, locale))}\n\nWrite the key insights in ${language}.`,
			},
		];
	}

	private withPeriod(text: string, current: string, previous: string): string {
		return text.replaceAll("{current}", current).replaceAll("{previous}", previous);
	}

	private instructions(language: string, current: string): string {
		return `Identify the most useful signals in ${current} for Plei's operations team. Write 2–3 short bullet points in ${language}. Write one bullet per metric line that has a change, keeping its exact number and its direction word (up or down); never move a number to another metric. Lead with the strongest change, then explain a divergence between activation, players, games or confirmation when supported. Include the comparison period and supporting numbers, not a recap of scorecards or busiest times. Suggest what to investigate without inventing causes. A zero previous count means no percentage baseline, not infinite growth. Small counts are weak evidence. Four weekly points and one previous period cannot establish historical normality, seasonality or a statistical anomaly; never claim unusual or more-than-normal activity. If changes are flat or unavailable, say there is no clear signal in the available comparisons. Use only supplied facts. For markets, write a plain overall-change opening paragraph, followed by contributor bullets. All markets names markets only; a selected market names facilities only. Preserve the supplied contributors and their counts. Use one bullet per line, starting with "- ". No headings or other markdown.`;
	}

	private direction(value: number, unit: string, previous: string): string {
		if (value === 0) return `unchanged from ${previous}`;
		const word = value > 0 ? "up" : "down";
		return `${word} ${Math.abs(value)}${unit} from ${previous}`;
	}

	private metricFact(
		name: string,
		previous: number,
		current: number,
		changePercent: number | null,
		previousPeriod: string,
	): string {
		const change =
			changePercent === null
				? "no previous baseline, so no percentage"
				: this.direction(changePercent, "%", previousPeriod);
		return `${name}: ${previous} → ${current}, ${change}.`;
	}

	private confirmationFact(
		rate: number | null,
		changePoints: number | null,
		previousPeriod: string,
	): string {
		if (rate === null) return "Confirmation rate: unavailable.";
		const change =
			changePoints === null
				? "no previous rate to compare"
				: this.direction(changePoints, " percentage points", previousPeriod);
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
		const { current, previous } = PERIOD_TEXT[stats.period];
		const start = this.formatDay(stats.start, locale, false);
		const end = this.formatDay(stats.end, locale, true);
		return [
			this.subjectFact(subject),
			...this.scopeFacts(subject),
			...(subject.insightFacts
				? [
						`Largest contributors to the games change (preserve their names and counts): ${subject.insightFacts}`,
					]
				: []),
			`Period: ${current} (${start} to ${end}), compared with ${previous}.`,
			this.metricFact(
				"Pickup games played",
				stats.playedPrevious,
				stats.played,
				stats.playedChangePercent,
				previous,
			),
			this.metricFact(
				"Unique players",
				stats.uniquePlayersPrevious,
				stats.uniquePlayers,
				stats.uniquePlayersChangePercent,
				previous,
			),
			this.metricFact(
				"Newly activated players",
				stats.activatedPlayersPrevious,
				stats.activatedPlayers,
				stats.activatedPlayersChangePercent,
				previous,
			),
			this.confirmationFact(stats.confirmationRate, stats.confirmationRateChangePoints, previous),
		];
	}

	private factsMessage(facts: string[]): string {
		return `Facts:\n${facts.join("\n")}`;
	}

	private languageFor(locale: string): string {
		return ActivitySummaryPrompt.LANGUAGE_BY_LOCALE[locale] ?? DEFAULT_LANGUAGE;
	}

	private exampleSummaryFor(locale: string, { stats }: ActivitySummarySubject): string {
		const text = EXAMPLE_PREVIOUS_BY_LOCALE[locale] ?? PERIOD_TEXT;
		const example =
			ActivitySummaryPrompt.EXAMPLE_SUMMARY_BY_LOCALE[locale] ?? DEFAULT_EXAMPLE_SUMMARY;
		return this.withPeriod(example, text[stats.period].current, text[stats.period].previous);
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
