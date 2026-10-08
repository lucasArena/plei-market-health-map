"use client";

import {
	type FacilityPlayerStatsView,
	type FacilityReservationDetailView,
	type FacilityReservationStatsView,
	type MarketSummaryFacilityRankView,
	type MarketSummaryMarketRankView,
	type MarketSummaryScopeView,
	type MarketSummaryView,
	STATS_PERIOD_DAYS,
	type StatsPeriod,
	toPlayerPeriodView,
	toReservationPeriodView,
} from "@market-health-map/core/application";
import { type GameDepartment, localDay, statsWindow } from "@market-health-map/core/domain";
import { formatMessage, type StatsPeriodMessages } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo } from "react";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";
import { browserTimeZone } from "@/infrastructure/time/stats-day";
import { aiSummaryContextFor } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import {
	activityPeriodFor,
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
	MarketSummaryComparison,
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
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { requestFeedback } from "@/presentation/hooks/use-feedback/feedback-requests";
import { useMarketGameInsights } from "@/presentation/hooks/use-market/use-market-game-insights";
import { useMarketPlayerStats } from "@/presentation/hooks/use-market/use-market-player-stats";
import { useMarketSummary } from "@/presentation/hooks/use-market/use-market-summary";
import { useMarketSummaryFilters } from "@/presentation/hooks/use-market/use-market-summary-filters";

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

export function contributorFactsFrom(summaryText: string | null | undefined): string | undefined {
	const contributors = (summaryText ?? "").split("\n\n").slice(1).join("\n\n");
	return contributors || undefined;
}

export function buildMarketSummaryText(
	summary: MarketSummaryView,
	playerStats: FacilityPlayerStatsView | undefined,
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
	summaryNone: string = messages.summaryNone,
	isSingleMarket = false,
): string | null {
	const markets = summary.gameChanges ?? [];
	const changes = isSingleMarket ? markets.flatMap((market) => market.facilities) : markets;
	const declines = changes
		.filter((item) => item.change < 0)
		.sort((a, b) => a.change - b.change || a.name.localeCompare(b.name))
		.slice(0, 2);
	const increases = changes
		.filter((item) => item.change > 0)
		.sort((a, b) => b.change - a.change || a.name.localeCompare(b.name))
		.slice(0, 2);
	const selected = [...declines, ...increases];
	const reservations = toReservationPeriodView(summary.stats, period);
	if (selected.length > 0) {
		const totalChange = reservations.played - reservations.playedPrevious;
		const overall = formatMessage(messages.overallGameChange, {
			change: `${totalChange > 0 ? "+" : ""}${formatters.number.format(totalChange)}`,
			previous: formatters.number.format(reservations.playedPrevious),
			current: formatters.number.format(reservations.played),
			comparison: periodMessages.comparison,
		});
		const insights = selected.map((item) =>
			formatMessage(messages.marketGameInsight, {
				name: item.name,
				direction: item.change < 0 ? messages.gamesDeclined : messages.gamesIncreased,
				comparison: formatMessage(messages.gameChange, {
					previous: formatters.number.format(item.playedPrevious),
					current: formatters.number.format(item.played),
					percent:
						item.changePercent === null
							? messages.noBaseline
							: `${formatters.decimal.format(item.changePercent)}%`,
					comparison: periodMessages.comparison,
				}),
				change: `${item.change > 0 ? "+" : ""}${formatters.number.format(item.change)}`,
			}),
		);
		return [overall, ...insights].join("\n\n");
	}
	if (!playerStats) return null;
	return buildSummary(
		{ ...reservations, ...toPlayerPeriodView(playerStats, period) },
		{ ...detailMessages, summaryNone },
		periodMessages,
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
		value: formatGames(market.games, detailMessages, formatters),
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
		value: formatGames(facility.games, detailMessages, formatters),
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
	period: StatsPeriod,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
) {
	return {
		tiles: buildProgressiveTiles(
			toReservationPeriodView(stats, period),
			playerStats ? toPlayerPeriodView(playerStats, period) : undefined,
			isPlayerPending,
			detailMessages,
			formatters,
		),
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
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
	isSingleMarket = false,
): MarketSummaryViewModel {
	const rankings = summary.periods[period];
	const scopeTiles = buildScopeTiles(rankings.scope, messages, formatters);
	return {
		...activityViews(
			summary.stats,
			playerStats,
			isPlayerPending,
			period,
			detailMessages,
			formatters,
		),
		summary: buildMarketSummaryText(
			summary,
			playerStats,
			period,
			messages,
			detailMessages,
			periodMessages,
			formatters,
			isSingleMarket ? messages.marketSummaryNone : messages.summaryNone,
			isSingleMarket,
		),
		scopeTiles: isSingleMarket ? [] : scopeTiles,
		topMarkets: isSingleMarket
			? null
			: buildMarketRows(rankings.topMarkets, messages, detailMessages, formatters),
		topFacilities: buildFacilityRows(rankings.topFacilities, detailMessages, formatters),
	};
}

export function buildFacilitySummaryViewModel(
	stats: FacilityReservationStatsView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	period: StatsPeriod,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): MarketSummaryViewModel {
	return {
		...activityViews(stats, playerStats, isPlayerPending, period, detailMessages, formatters),
		summary: playerStats
			? buildSummary(
					activityPeriodFor(stats, playerStats, period),
					detailMessages,
					periodMessages,
					formatters,
				)
			: null,
		scopeTiles: [],
		topMarkets: null,
		topFacilities: null,
	};
}

export function buildScopeHeading(
	scope: MapScope,
	messages: MarketSummaryMessages,
	periodMessages: StatsPeriodMessages,
): MarketSummaryHeading {
	const span = periodMessages.span;
	if (scope.kind === "facility") {
		return {
			title: scope.name,
			subtitle: formatMessage(messages.facilitySubtitle, { market: scope.marketName, span }),
		};
	}
	if (scope.kind === "market") {
		return { title: scope.name, subtitle: formatMessage(messages.marketSubtitle, { span }) };
	}
	return { title: messages.allMarkets, subtitle: formatMessage(messages.subtitle, { span }) };
}

function utcDate(isoDate: string): Date {
	return new Date(`${isoDate}T00:00:00Z`);
}

export function buildComparisonRange(
	today: string,
	period: StatsPeriod,
	locale: string,
	messages: MarketSummaryMessages,
): MarketSummaryComparison {
	const window = statsWindow(today, STATS_PERIOD_DAYS[period]);
	const withYear = new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});
	const withoutYear = new Intl.DateTimeFormat(locale, {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
	return {
		current: withYear.formatRange(utcDate(window.start), utcDate(window.end)),
		previous: formatMessage(messages.comparedWith, {
			range: withoutYear.formatRange(utcDate(window.previousStart), utcDate(window.previousEnd)),
		}),
	};
}

export function buildScopeLine(
	scope: MapScope,
	counts: MarketSummaryScopeView | undefined,
	heading: MarketSummaryHeading,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): string {
	if (scope.kind === "facility" || !counts) return heading.subtitle;
	const facilities = formatMessage(messages.facilitiesActive, {
		active: formatters.number.format(counts.activeFacilityCount),
		total: formatters.number.format(counts.facilityCount),
	});
	if (scope.kind === "market") return facilities;
	const markets = formatMessage(messages.marketsActive, {
		active: formatters.number.format(counts.activeMarketCount),
		total: formatters.number.format(counts.marketCount),
	});
	return formatMessage(messages.scopeCounts, { facilities, markets });
}

export function buildDataAsOf(
	updatedAt: number | undefined,
	locale: string,
	messages: MarketSummaryMessages,
): string | null {
	if (!updatedAt) return null;
	const time = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
		new Date(updatedAt),
	);
	return formatMessage(messages.dataAsOf, { time });
}

export function buildMarketAiSubject(
	scope: MapScope,
	heading: MarketSummaryHeading,
	summary: MarketSummaryView | undefined,
	facilityReport: FacilityReservationDetailView | undefined,
	playerStats: FacilityPlayerStatsView | undefined,
	period: StatsPeriod,
	gameDepartments: readonly GameDepartment[] = [],
): ActivitySummarySubject | null {
	if (!playerStats) return null;
	if (scope.kind === "facility") {
		return facilityReport
			? {
					kind: "facility",
					id: scope.id,
					name: heading.title,
					stats: activityPeriodFor(facilityReport.stats, playerStats, period),
				}
			: null;
	}
	if (!summary) return null;
	const id = scope.kind === "market" ? scope.id : "all";
	const isFiltered = gameDepartments.length > 0;
	return {
		kind: scope.kind === "market" ? "market" : "all-markets",
		id: isFiltered ? `${id}~${gameDepartments.join("+")}` : id,
		name: heading.title,
		stats: activityPeriodFor(summary.stats, playerStats, period),
		scope: summary.periods[period].scope,
		...(isFiltered ? { gameDepartments: [...gameDepartments] } : {}),
	};
}

export function useMarketSummaryPanelRules({
	isClosing,
	onClose,
	onClosed,
}: MarketSummaryPanelProps) {
	const { locale, messages } = useMessages();
	const { period, scope } = useMapScope();
	const periodMessages = messages.statsPeriods[period];
	const facilityId = scope.kind === "facility" ? scope.id : null;
	const marketId = scope.kind === "market" ? scope.id : null;
	const isMarketScope = facilityId === null;
	const { departments } = useMarketSummaryFilters();
	const isRedesigned = useFeatureFlag("insights-panel-v3");
	const summaryQuery = useMarketSummary(marketId, isMarketScope, departments);
	const insightsQuery = useMarketGameInsights(
		marketId,
		period,
		isMarketScope && !!summaryQuery.data,
		departments,
	);
	const marketPlayerQuery = useMarketPlayerStats(marketId, isMarketScope, departments);
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
						period,
						messages.facilityDetail,
						periodMessages,
						formatters,
					)
				: null;
		}
		return summary
			? buildMarketSummaryViewModel(
					{ ...summary, gameChanges: insightsQuery.data },
					playerStats,
					playerQuery.isPending,
					period,
					messages.marketSummary,
					messages.facilityDetail,
					periodMessages,
					formatters,
					marketId !== null,
				)
			: null;
	}, [
		period,
		periodMessages,
		facilityReport,
		formatters,
		isMarketScope,
		marketId,
		insightsQuery.data,
		messages.facilityDetail,
		messages.marketSummary,
		playerQuery.isPending,
		playerStats,
		summary,
	]);
	const insightsView =
		isMarketScope && insightsQuery.isPending && view ? { ...view, summary: null } : view;
	const heading = useMemo(
		() => buildScopeHeading(scope, messages.marketSummary, periodMessages),
		[scope, messages.marketSummary, periodMessages],
	);
	const aiContext = useMemo(() => {
		if (isMarketScope && (insightsQuery.isPending || insightsQuery.isError)) return null;
		const subject = buildMarketAiSubject(
			scope,
			heading,
			summary,
			facilityReport,
			playerStats,
			period,
			departments,
		);
		return subject
			? aiSummaryContextFor(
					{ ...subject, insightFacts: contributorFactsFrom(view?.summary) },
					locale,
				)
			: null;
	}, [
		period,
		scope,
		heading,
		summary,
		facilityReport,
		playerStats,
		insightsQuery.isPending,
		insightsQuery.isError,
		view?.summary,
		isMarketScope,
		locale,
		departments,
	]);
	const status = resolveDetailStatus(reportQuery.isPending, reportQuery.isError);
	const comparison = useMemo(
		() =>
			buildComparisonRange(
				localDay(new Date(), browserTimeZone()),
				period,
				locale,
				messages.marketSummary,
			),
		[locale, messages.marketSummary, period],
	);
	const scopeLine = buildScopeLine(
		scope,
		isMarketScope ? summary?.periods[period].scope : undefined,
		heading,
		messages.marketSummary,
		formatters,
	);
	const dataAsOf = buildDataAsOf(reportQuery.dataUpdatedAt, locale, messages.marketSummary);
	const reportWrongNumber = useCallback(() => requestFeedback("bug"), []);

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

	const rankingsEmptyLabel = formatMessage(messages.marketSummary.noRankings, {
		within: periodMessages.within,
	});

	return {
		aiContext,
		comparison,
		dataAsOf,
		isRedesigned,
		rankingsEmptyLabel,
		reportWrongNumber,
		scopeLine,
		detailMessages: messages.facilityDetail,
		handleAnimationEnd,
		heading,
		isClosing,
		isSummaryPending:
			status === "ready" && ((isMarketScope && insightsQuery.isPending) || playerQuery.isPending),
		isInsightsFailed: isMarketScope && insightsQuery.isError,
		messages: messages.marketSummary,
		onClose,
		status,
		view: insightsView,
	};
}
