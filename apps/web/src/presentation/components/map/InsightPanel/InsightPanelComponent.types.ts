import type { Messages } from "@market-health-map/core/i18n";
import type {
	GamesCardView,
	GamesHeroView,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import type { FacilityStatTile } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import type { MarketListRowView } from "@/presentation/components/map/MarketList/MarketListComponent.types";
import type { PopularTimeCellView } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.types";
import type { MapNavigation } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";

export type MarketSummaryMessages = Messages["marketSummary"];

export interface InsightPanelProps {
	isClosing: boolean;
	onClose: () => void;
	onClosed: () => void;
}

/**
 * A top facility, in the Markets row shape so the Facilities module reuses the
 * Markets module (MarketList kind="facilities"). No trend data per facility:
 * status and change stay null.
 */
export interface MarketRankRowView extends MarketListRowView {
	/** Facility id and market, so the row can open the Facility level. */
	marketName: string;
	/** Server order (games desc); kept for the AI subject. */
	rank: number;
	/** "41 games", for the AI subject and the row's accessible name. */
	value: string;
}

/** Panel levels: All markets → Market → Facility. Rename the Market level via breadcrumbLevelMarket. */
export type ScopeLevel = "all" | "market" | "facility";

export interface ScopeCrumbView {
	key: ScopeLevel;
	label: string;
	title: string;
	/** Where the crumb goes; null for the current crumb or when the target is unknown. */
	target: MapNavigation | null;
}

export interface MarketSummaryViewModel {
	summary: string | null;
	/** Games card: games played hero, weekly chart, confirmation, cancellation, posted. */
	games: GamesCardView;
	/** Player tiles only; games played and confirmation live in the games card. */
	tiles: FacilityStatTile[];
	/** Glass Markets list. Null outside the All-markets scope. */
	/** Users module (Games format) from the player stats; null until they load or when unavailable. */
	users: GamesCardView | null;
	/** Player stats still loading: the Users box shows a skeleton. */
	isUsersPending: boolean;
	/** Active markets header (Games-style big number); null where the Markets module is hidden. */
	marketsHero: GamesHeroView | null;
	topMarkets: MarketListRowView[] | null;
	/** Active facilities header (Games-style big number); null at the Facility level. */
	facilitiesHero: GamesHeroView | null;
	topFacilities: MarketRankRowView[] | null;
	lastPlayedLabel: string;
}

/**
 * Facility level only: the parts of the old facility drawer the shared
 * summary view does not already cover (identity and popular times).
 */
export interface FacilityLevelView {
	name: string;
	address: string;
	avatarUrl: string | null;
	popularTimes: PopularTimeCellView[];
	dayLabels: string[];
	timePeriodLabels: string[];
}

export interface MarketSummaryHeading {
	title: string;
	subtitle: string;
	crumbs: ScopeCrumbView[];
}
