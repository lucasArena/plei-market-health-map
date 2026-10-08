import type { Messages } from "@market-health-map/core/i18n";
import type { ReactNode } from "react";
import type { WeeklyActivityPointView } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent.types";
import type { FacilityStatTile } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
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
	messages: MarketSummaryMessages;
}

export interface MarketSummaryHeaderProps {
	comparison: MarketSummaryComparison;
	heading: MarketSummaryHeading;
	isRedesigned: boolean;
	scopeLine: string;
}
