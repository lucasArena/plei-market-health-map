import type { FacilityGameChangeView } from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";
import type { GamesTrendView } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import type { ScopeHeaderView } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent.types";
import type { ScorecardView } from "@/presentation/components/displays/Scorecards/ScorecardsComponent.types";
import type { StatusSummaryProps } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.types";

export type MarketViewMessages = Messages["marketView"];

export interface MarketOverviewProps {
	marketId: string;
	marketName: string;
}

export interface WeekStreak {
	weeks: number;
	direction: "up" | "down" | "flat";
}

export interface MarketDrivers {
	facilities: FacilityGameChangeView[];
	share: number;
	total: number;
}

export type ScoreCardView = ScorecardView;

export interface MarketScorecardsView {
	played: ScoreCardView;
	confirmation: ScoreCardView;
	cancellation: ScoreCardView;
}

export type MarketHeaderView = ScopeHeaderView;

export type MarketStatusView = StatusSummaryProps;

export type MarketTrendView = GamesTrendView;
