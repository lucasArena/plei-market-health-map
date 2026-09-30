"use client";

import type {
	FacilityPlayerStatsView,
	MarketSummaryFacilityRankView,
	MarketSummaryMarketRankView,
	MarketSummaryScopeView,
	MarketSummaryView,
} from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo } from "react";
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
	MarketSummaryMessages,
	MarketSummaryPanelProps,
	MarketSummaryViewModel,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
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
): string | null {
	if (!playerStats) return null;
	const facilities = formatters.number.format(summary.scope.activeFacilityCount);
	return buildSummary(
		{ ...summary.stats, ...playerStats },
		{
			...detailMessages,
			summaryNone: messages.summaryNone,
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

export function buildMarketSummaryViewModel(
	summary: MarketSummaryView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
): MarketSummaryViewModel {
	const { stats } = summary;
	return {
		summary: buildMarketSummaryText(summary, playerStats, messages, detailMessages, formatters),
		scopeTiles: buildScopeTiles(summary.scope, messages, formatters),
		tiles: buildProgressiveTiles(stats, playerStats, isPlayerPending, detailMessages, formatters),
		weeklyActivity: buildWeeklyActivity(stats, detailMessages, formatters),
		popularTimes: buildPopularTimes(stats, detailMessages, formatters),
		dayLabels: [...detailMessages.dayLabels],
		timePeriodLabels: [...detailMessages.timePeriodLabels],
		topMarkets: buildMarketRows(summary.topMarkets, messages, detailMessages, formatters),
		topFacilities: buildFacilityRows(summary.topFacilities, detailMessages, formatters),
		lastPlayedLabel: stats.lastPlayedDate
			? formatMessage(detailMessages.lastPlayed, {
					date: formatters.dayWithYear.format(new Date(`${stats.lastPlayedDate}T00:00:00Z`)),
				})
			: detailMessages.neverPlayed,
	};
}

export function useMarketSummaryPanelRules({
	isClosing,
	onClose,
	onClosed,
}: MarketSummaryPanelProps) {
	const { locale, messages } = useMessages();
	const summaryQuery = useMarketSummary();
	const playerQuery = useMarketPlayerStats();
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const summary = summaryQuery.data;
	const playerStats = playerQuery.data;
	const view = useMemo(
		() =>
			summary
				? buildMarketSummaryViewModel(
						summary,
						playerStats,
						playerQuery.isPending,
						messages.marketSummary,
						messages.facilityDetail,
						formatters,
					)
				: null,
		[
			formatters,
			messages.facilityDetail,
			messages.marketSummary,
			playerQuery.isPending,
			playerStats,
			summary,
		],
	);
	const status = resolveDetailStatus(summaryQuery.isPending, summaryQuery.isError);

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
		detailMessages: messages.facilityDetail,
		handleAnimationEnd,
		isClosing,
		isSummaryPending: status === "ready" && playerQuery.isPending,
		messages: messages.marketSummary,
		onClose,
		status,
		view,
	};
}
