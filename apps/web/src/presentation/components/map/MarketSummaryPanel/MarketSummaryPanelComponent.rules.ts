"use client";

import type {
	FacilityPlayerStatsView,
	FacilityReservationDetailView,
	FacilityReservationStatsView,
	MarketSummaryFacilityRankView,
	MarketSummaryMarketRankView,
	MarketSummaryScopeView,
	MarketSummaryView,
} from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo } from "react";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";
import { aiSummaryContextFor } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import {
	buildPopularTimes,
	buildProgressiveTiles,
	buildSummary,
	buildWeeklyActivity,
	createDetailFormatters,
	formatGames,
	resolveDetailStatus,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	ChangeDirection,
	type DetailFormatters,
	type DetailMessages,
	type FacilityStatTile,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import type {
	MarketRankRowView,
	MarketSummaryHeading,
	MarketSummaryMessages,
	MarketSummaryPanelProps,
	MarketSummaryViewModel,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityPlayerStats } from "@/presentation/hooks/use-facility/use-facility-player-stats";
import { useFacilityReservationStats } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";
import { useMarketPlayerStats } from "@/presentation/hooks/use-market/use-market-player-stats";
import { useMarketSummary } from "@/presentation/hooks/use-market/use-market-summary";

function scopeTile(
	key: string,
	label: string,
	active: number,
	total: number,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): FacilityStatTile {
	return {
		key,
		label,
		value: formatters.number.format(active),
		hint: formatMessage(messages.ofTotal, { total: formatters.number.format(total) }),
		hintDirection: ChangeDirection.flat,
		isLoading: false,
	};
}

export function buildScopeTiles(
	scope: MarketSummaryScopeView,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): FacilityStatTile[] {
	return [
		scopeTile(
			"facilities",
			messages.activeFacilities,
			scope.activeFacilityCount,
			scope.facilityCount,
			messages,
			formatters,
		),
		scopeTile(
			"markets",
			messages.activeMarkets,
			scope.activeMarketCount,
			scope.marketCount,
			messages,
			formatters,
		),
	];
}

export function buildMarketSummaryText(
	summary: MarketSummaryView,
	playerStats: FacilityPlayerStatsView | undefined,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
	summaryNone: string = messages.summaryNone,
): string | null {
	if (!playerStats) return null;
	const facilities = formatters.number.format(summary.scope.activeFacilityCount);
	return buildSummary(
		{ ...summary.stats, ...playerStats },
		{
			...detailMessages,
			summaryNone,
			summaryActivity: formatMessage(messages.summaryActivity, { facilities }),
		},
		formatters,
	);
}

export function buildMarketRows(
	markets: MarketSummaryMarketRankView[],
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
): MarketRankRowView[] {
	return markets.map((market, index) => ({
		key: market.id,
		rank: index + 1,
		name: market.name,
		detail: formatMessage(messages.marketFacilities, {
			active: formatters.number.format(market.activeFacilityCount),
			total: formatters.number.format(market.facilityCount),
		}),
		value: formatGames(market.gamesLast28Days, detailMessages, formatters),
	}));
}

export function buildFacilityRows(
	facilities: MarketSummaryFacilityRankView[],
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
): MarketRankRowView[] {
	return facilities.map((facility, index) => ({
		key: facility.id,
		rank: index + 1,
		name: facility.name,
		detail: facility.marketName,
		value: formatGames(facility.gamesLast28Days, detailMessages, formatters),
	}));
}

function lastPlayedLabel(
	stats: FacilityReservationStatsView,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
): string {
	return stats.lastPlayedDate
		? formatMessage(detailMessages.lastPlayed, {
				date: formatters.dayWithYear.format(new Date(`${stats.lastPlayedDate}T00:00:00Z`)),
			})
		: detailMessages.neverPlayed;
}

function activityViews(
	stats: FacilityReservationStatsView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
) {
	return {
		tiles: buildProgressiveTiles(stats, playerStats, isPlayerPending, detailMessages, formatters),
		weeklyActivity: buildWeeklyActivity(stats, detailMessages, formatters),
		popularTimes: buildPopularTimes(stats, detailMessages, formatters),
		dayLabels: [...detailMessages.dayLabels],
		timePeriodLabels: [...detailMessages.timePeriodLabels],
		lastPlayedLabel: lastPlayedLabel(stats, detailMessages, formatters),
	};
}

export function buildMarketSummaryViewModel(
	summary: MarketSummaryView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
	isSingleMarket = false,
): MarketSummaryViewModel {
	const scopeTiles = buildScopeTiles(summary.scope, messages, formatters);
	return {
		...activityViews(summary.stats, playerStats, isPlayerPending, detailMessages, formatters),
		summary: buildMarketSummaryText(
			summary,
			playerStats,
			messages,
			detailMessages,
			formatters,
			isSingleMarket ? messages.marketSummaryNone : messages.summaryNone,
		),
		scopeTiles: isSingleMarket ? scopeTiles.filter((tile) => tile.key !== "markets") : scopeTiles,
		topMarkets: isSingleMarket
			? null
			: buildMarketRows(summary.topMarkets, messages, detailMessages, formatters),
		topFacilities: buildFacilityRows(summary.topFacilities, detailMessages, formatters),
	};
}

export function buildFacilitySummaryViewModel(
	stats: FacilityReservationStatsView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
): MarketSummaryViewModel {
	return {
		...activityViews(stats, playerStats, isPlayerPending, detailMessages, formatters),
		summary: playerStats
			? buildSummary({ ...stats, ...playerStats }, detailMessages, formatters)
			: null,
		scopeTiles: [],
		topMarkets: null,
		topFacilities: null,
	};
}

export function buildScopeHeading(
	scope: MapScope,
	messages: MarketSummaryMessages,
): MarketSummaryHeading {
	if (scope.kind === "facility") {
		return {
			title: scope.name,
			subtitle: formatMessage(messages.facilitySubtitle, { market: scope.marketName }),
		};
	}
	if (scope.kind === "market") return { title: scope.name, subtitle: messages.marketSubtitle };
	return { title: messages.allMarkets, subtitle: messages.subtitle };
}

export function buildMarketAiSubject(
	scope: MapScope,
	heading: MarketSummaryHeading,
	summary: MarketSummaryView | undefined,
	facilityReport: FacilityReservationDetailView | undefined,
	playerStats: FacilityPlayerStatsView | undefined,
): ActivitySummarySubject | null {
	if (!playerStats) return null;
	if (scope.kind === "facility") {
		return facilityReport
			? {
					kind: "facility",
					id: scope.id,
					name: heading.title,
					stats: { ...facilityReport.stats, ...playerStats },
				}
			: null;
	}
	if (!summary) return null;
	return {
		kind: scope.kind === "market" ? "market" : "all-markets",
		id: scope.kind === "market" ? scope.id : "all",
		name: heading.title,
		stats: { ...summary.stats, ...playerStats },
		scope: summary.scope,
	};
}

export function useMarketSummaryPanelRules({
	isClosing,
	onClose,
	onClosed,
}: MarketSummaryPanelProps) {
	const { locale, messages } = useMessages();
	const { scope } = useMapScope();
	const facilityId = scope.kind === "facility" ? scope.id : null;
	const marketId = scope.kind === "market" ? scope.id : null;
	const isMarketScope = facilityId === null;
	const summaryQuery = useMarketSummary(marketId, isMarketScope);
	const marketPlayerQuery = useMarketPlayerStats(marketId, isMarketScope);
	const facilityQuery = useFacilityReservationStats(facilityId);
	const facilityPlayerQuery = useFacilityPlayerStats(facilityId);
	const reportQuery = isMarketScope ? summaryQuery : facilityQuery;
	const playerQuery = isMarketScope ? marketPlayerQuery : facilityPlayerQuery;
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const summary = summaryQuery.data;
	const facilityReport = facilityQuery.data;
	const playerStats = playerQuery.data;
	const view = useMemo(() => {
		if (!isMarketScope) {
			return facilityReport
				? buildFacilitySummaryViewModel(
						facilityReport.stats,
						playerStats,
						playerQuery.isPending,
						messages.facilityDetail,
						formatters,
					)
				: null;
		}
		return summary
			? buildMarketSummaryViewModel(
					summary,
					playerStats,
					playerQuery.isPending,
					messages.marketSummary,
					messages.facilityDetail,
					formatters,
					marketId !== null,
				)
			: null;
	}, [
		facilityReport,
		formatters,
		isMarketScope,
		marketId,
		messages.facilityDetail,
		messages.marketSummary,
		playerQuery.isPending,
		playerStats,
		summary,
	]);
	const heading = useMemo(
		() => buildScopeHeading(scope, messages.marketSummary),
		[scope, messages.marketSummary],
	);
	const aiContext = useMemo(() => {
		const subject = buildMarketAiSubject(scope, heading, summary, facilityReport, playerStats);
		return subject ? aiSummaryContextFor(subject, locale) : null;
	}, [scope, heading, summary, facilityReport, playerStats, locale]);
	const status = resolveDetailStatus(reportQuery.isPending, reportQuery.isError);

	const handleAnimationEnd = useCallback(() => {
		if (isClosing) onClosed();
	}, [isClosing, onClosed]);

	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [onClose]);

	return {
		aiContext,
		detailMessages: messages.facilityDetail,
		handleAnimationEnd,
		heading,
		isClosing,
		isSummaryPending: status === "ready" && playerQuery.isPending,
		messages: messages.marketSummary,
		onClose,
		status,
		view,
	};
}
