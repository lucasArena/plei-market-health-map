import type { Messages } from "@market-health-map/core/i18n";
import type { ReactNode } from "react";
import type {
	GamesMetricView,
	GamesTrendView,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import type { InsightTone } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";
import type { WeeklyActivityPointView } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent.types";
import type {
	DetailMessages,
	FacilityStatTile,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import type { PopularTimeCellView } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.types";

export type MarketSummaryMessages = Messages["marketSummary"];

export interface MarketSummaryPanelProps {
	isClosing: boolean;
	onClose: () => void;
	onClosed: () => void;
}

export interface MarketRankRowView {
	key: string;
	rank: number;
	name: string;
	detail: string;
	value: string;
}

export interface MarketRankListProps {
	title: string;
	rows: MarketRankRowView[];
	emptyLabel: string;
}

export interface MarketSummaryViewModel {
	summary: string | null;
	scopeTiles: FacilityStatTile[];
	tiles: FacilityStatTile[];
	weeklyActivity: WeeklyActivityPointView[];
	popularTimes: PopularTimeCellView[];
	dayLabels: string[];
	timePeriodLabels: string[];
	topMarkets: MarketRankRowView[] | null;
	topFacilities: MarketRankRowView[] | null;
	lastPlayedLabel: string;
}

export interface MarketSummaryHeading {
	title: string;
	subtitle: string;
}

export interface MarketSummaryComparison {
	current: string;
	previous: string;
}

export interface InsightCardProps {
	children: ReactNode;
	isRedesigned: boolean;
	tone?: InsightTone;
}

export interface MarketSummaryInsightHeading {
	title: string;
	tone: InsightTone;
}

export interface MarketRankRowsProps {
	rows: MarketRankRowView[];
	emptyLabel: string;
}

export interface MarketSummaryMetricsProps {
	detailMessages: DetailMessages;
	gamesTrend: GamesTrendView | null;
	isRedesigned: boolean;
	messages: MarketSummaryMessages;
	rankingsEmptyLabel: string;
	gamesTitle: string;
	isUsersPending: boolean;
	playersTrend: GamesTrendView | null;
	supplyDemand: SupplyDemandView | null;
	userMetrics: GamesMetricView[];
	view: MarketSummaryViewModel;
}

export interface MarketSummaryHeaderProps {
	comparison: MarketSummaryComparison;
	heading: MarketSummaryHeading;
	isRedesigned: boolean;
	scopeLine: string;
}

export interface TrendWeekCount {
	weekStart: string;
	value: number;
}

export interface TrendViewInput {
	value: number;
	previous: number;
	changePercent: number | null;
	weeks: TrendWeekCount[];
	tooltip: string;
	pointLabel: string;
	metrics: GamesMetricView[];
}

export interface UsersSectionBodyProps {
	isUsersPending: boolean;
	playersTrend: GamesTrendView | null;
	userMetrics: GamesMetricView[];
}

export type SupplyDemandStatus = "underSupplied" | "balanced" | "overSupplied";

export interface SupplyDemandView {
	status: SupplyDemandStatus;
	statusLabel: string;
	ratio: string;
	ratioLabel: string;
	benchmark: string;
	advice: string;
}

export interface SupplyDemandCardProps {
	title: string;
	view: SupplyDemandView;
}
