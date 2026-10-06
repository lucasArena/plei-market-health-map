import type {
	ActivityPeriodView,
	MarketSummaryScopeView,
	StatsPeriod,
} from "@market-health-map/core/application";

export type ActivitySummaryKind = "facility" | "market" | "all-markets";

export type ActivitySummaryStats = ActivityPeriodView;

export interface PromptPeriodText {
	current: string;
	previous: string;
}

export type PromptPeriodTexts = Record<StatsPeriod, PromptPeriodText>;

export interface ActivitySummarySubject {
	kind: ActivitySummaryKind;
	id: string;
	name: string;
	stats: ActivitySummaryStats;
	scope?: MarketSummaryScopeView;
	insightFacts?: string;
}
