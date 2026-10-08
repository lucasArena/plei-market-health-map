import type {
	ActivityPeriodView,
	MarketSummaryScopeView,
	StatsPeriod,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";

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
	gameDepartments?: GameDepartment[];
}
