import type {
	MarketGameChangeView,
	MarketSummaryMarketRankView,
} from "@market-health-map/core/application";
import type { Messages } from "@market-health-map/core/i18n";
import type { ReactNode } from "react";
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
	markets: MarketSummaryMarketRankView[] | null;
	marketChanges: MarketGameChangeView[] | undefined;
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
	isRedesigned: boolean;
	messages: MarketSummaryMessages;
	periodLabel: string;
	rankingsEmptyLabel: string;
	tiles: MarketSummarySectionTiles;
	view: MarketSummaryViewModel;
}

export interface MarketSummarySectionTiles {
	games: FacilityStatTile[];
	users: FacilityStatTile[];
}

export interface MarketSummaryHeaderProps {
	comparison: MarketSummaryComparison;
	heading: MarketSummaryHeading;
	isRedesigned: boolean;
	scopeLine: string;
}
