import type { FacilityGameChangeView, StatsPeriod } from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";
import type { BreadcrumbItem } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent.types";
import type { ScoreCardProps } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent.types";
import type { SegmentedOption } from "@/presentation/components/displays/SegmentedControl/SegmentedControlComponent.types";
import type { StatusSummaryProps } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.types";
import type { WeeklyBarsProps } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.types";
import type { MarketSummaryComparison } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";

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

export type ScoreCardView = Omit<ScoreCardProps, "testId" | "size">;

export interface MarketScorecardsView {
	played: ScoreCardView;
	confirmation: ScoreCardView;
	cancellation: ScoreCardView;
}

export interface MarketHeaderView {
	breadcrumb: BreadcrumbItem[];
	breadcrumbLabel: string;
	title: string;
	level: string;
	periodLabel: string;
	periodOptions: SegmentedOption<StatsPeriod>[];
	comparison: MarketSummaryComparison;
	facilitiesActive: string | null;
}

export type MarketStatusView = StatusSummaryProps;

export type MarketTrendView = Omit<WeeklyBarsProps, "testId">;
