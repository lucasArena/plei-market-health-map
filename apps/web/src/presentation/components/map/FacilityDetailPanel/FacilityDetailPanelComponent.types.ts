import type { GamesTrend } from "@market-health-map/core/domain";
import type { Messages } from "@market-health-map/core/i18n";
import type { WeeklyActivityPointView } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent.types";
import type { PopularTimeCellView } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.types";

export const ChangeDirection = { up: "up", down: "down", flat: "flat" } as const;

export type DetailMessages = Messages["facilityDetail"];

export interface FacilityDetailPanelProps {
	facilityId: string;
	isClosing: boolean;
	onClose: () => void;
	onClosed: () => void;
	/** Games trend for the facility, only while Show trend is on. */
	trend?: GamesTrend | null;
}

export type FacilityDetailStatus = "loading" | "error" | "ready";

export type StatDirection = (typeof ChangeDirection)[keyof typeof ChangeDirection];

export interface FacilityStatTile {
	key: string;
	label: string;
	value: string;
	hint: string | null;
	hintDirection: StatDirection;
	isLoading: boolean;
}

export interface FacilityDetailViewModel {
	name: string;
	address: string;
	avatarUrl: string | null;
	summary: string | null;
	tiles: FacilityStatTile[];
	weeklyActivity: WeeklyActivityPointView[];
	popularTimes: PopularTimeCellView[];
	dayLabels: string[];
	timePeriodLabels: string[];
	lastPlayedLabel: string;
}

export interface DetailFormatters {
	number: Intl.NumberFormat;
	decimal: Intl.NumberFormat;
	plural: Intl.PluralRules;
	dayWithYear: Intl.DateTimeFormat;
	week: Intl.DateTimeFormat;
}
