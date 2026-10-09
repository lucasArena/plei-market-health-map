"use client";

import {
	type FacilityPlayerStatsView,
	type FacilityReservationDetailView,
	type FacilityReservationStatsView,
	type MarketAudienceView,
	type MarketSummaryFacilityRankView,
	type MarketSummaryMarketRankView,
	type MarketSummaryScopeView,
	type MarketSummaryView,
	type OverallGamesTrend,
	type ReservationPeriodView,
	STATS_PERIOD_DAYS,
	type StatsPeriod,
	toGamesTrend,
	toPlayerPeriodView,
	toReservationPeriodView,
} from "@market-health-map/core/application";
import { type GameDepartment, localDay, statsWindow } from "@market-health-map/core/domain";
import { formatMessage, type StatsPeriodMessages } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo } from "react";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";
import { browserTimeZone } from "@/infrastructure/time/stats-day";
import { aiSummaryContextFor } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import { niceAxisMax } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.rules";
import type {
	GamesMetricTone,
	GamesMetricView,
	GamesTrendChangeView,
	GamesTrendDirection,
	GamesTrendView,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import type { InsightTone } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";
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
	MarketSummaryInsightHeading,
	MarketSummaryMessages,
	MarketSummaryPanelProps,
	MarketSummaryViewModel,
	TrendViewInput,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import type { MapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityPlayerStats } from "@/presentation/hooks/use-facility/use-facility-player-stats";
import { useFacilityReservationStats } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";
import { requestFeedback } from "@/presentation/hooks/use-feedback/feedback-requests";
import { useMarketAudience } from "@/presentation/hooks/use-market/use-market-audience";
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

export const CURRENT_WEEKS: Record<StatsPeriod, number> = { week: 1, month: 4 };

export function signed(value: number, magnitude: string): string {
	if (value < 0) return `−${magnitude}`;
	if (value > 0) return `+${magnitude}`;
	return magnitude;
}

export function directionOfChange(value: number): GamesTrendDirection {
	if (value < 0) return "down";
	if (value > 0) return "up";
	return "flat";
}

export const TONE_WHEN_HIGHER: Record<
	"higherIsBetter" | "lowerIsBetter",
	Record<GamesTrendDirection, GamesMetricTone>
> = {
	higherIsBetter: { up: "good", down: "bad", flat: "neutral" },
	lowerIsBetter: { up: "bad", down: "good", flat: "neutral" },
};

function rateMetric(
	key: string,
	label: string,
	rate: number | null,
	previousRate: number | null,
	changePoints: number | null,
	polarity: keyof typeof TONE_WHEN_HIGHER,
	messages: MarketSummaryMessages,
): GamesMetricView {
	const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value)}%`);
	const rounded = changePoints === null ? null : Math.round(changePoints);
	const direction = rounded === null ? null : directionOfChange(rounded);
	return {
		key,
		label,
		value: percent(rate),
		previous: formatMessage(messages.metricVs, { value: percent(previousRate) }),
		change:
			rounded === null || direction === null
				? null
				: {
						label: formatMessage(messages.changePoints, {
							change: signed(rounded, String(Math.abs(rounded))),
						}),
						direction,
						tone: TONE_WHEN_HIGHER[polarity][direction],
					},
	};
}

function changeView(percent: number | null, played: number): GamesTrendChangeView | null {
	if (percent === null) return null;
	const rounded = Math.round(percent);
	if (rounded === 0) return { label: played > 0 ? "0%" : "—", direction: "flat" };
	return {
		label: `${signed(rounded, String(Math.abs(rounded)))}%`,
		direction: directionOfChange(rounded),
	};
}

function countMetric(
	key: string,
	label: string,
	value: number,
	previous: number,
	changePercent: number | null,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): GamesMetricView {
	const rounded = changePercent === null ? null : Math.round(changePercent);
	const direction = rounded === null ? null : directionOfChange(rounded);
	return {
		key,
		label,
		value: formatters.number.format(value),
		previous: formatMessage(messages.metricVs, { value: formatters.number.format(previous) }),
		change:
			rounded === null || direction === null
				? null
				: {
						label: `${signed(rounded, String(Math.abs(rounded)))}%`,
						direction,
						tone: TONE_WHEN_HIGHER.higherIsBetter[direction],
					},
	};
}

function pendingMetric(key: string, label: string): GamesMetricView {
	return { key, label, value: "", previous: "", change: null, isPending: true };
}

export function buildUserMetrics(
	audience: MarketAudienceView | undefined,
	isAudiencePending: boolean,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayersPending: boolean,
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): GamesMetricView[] {
	const count = (
		key: string,
		label: string,
		values: [value: number, previous: number, changePercent: number | null] | null,
		isPending: boolean,
	): GamesMetricView[] => {
		if (values) return [countMetric(key, label, ...values, messages, formatters)];
		return isPending ? [pendingMetric(key, label)] : [];
	};
	const users = audience?.periods[period];
	const players = playerStats ? toPlayerPeriodView(playerStats, period) : null;
	return [
		...(!players && isPlayersPending
			? [pendingMetric("activePlayers", messages.metricActivePlayers)]
			: []),
		...count(
			"registrations",
			messages.metricRegistrations,
			users
				? [users.registrations, users.registrationsPrevious, users.registrationsChangePercent]
				: null,
			isAudiencePending,
		),
		...count(
			"activeUsers",
			messages.metricActiveUsers,
			users ? [users.activeUsers, users.activeUsersPrevious, users.activeUsersChangePercent] : null,
			isAudiencePending,
		),
		...count(
			"uniqueUsers",
			messages.metricUniqueUsers,
			players
				? [players.uniquePlayers, players.uniquePlayersPrevious, players.uniquePlayersChangePercent]
				: null,
			isPlayersPending,
		),
	];
}

export function buildGamesMetrics(
	games: ReservationPeriodView,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): GamesMetricView[] {
	return [
		rateMetric(
			"confirmation",
			messages.metricConfirmation,
			games.confirmationRate,
			games.confirmationRatePrevious,
			games.confirmationRateChangePoints,
			"higherIsBetter",
			messages,
		),
		rateMetric(
			"cancellation",
			messages.metricCancellation,
			games.cancellationRate,
			games.cancellationRatePrevious,
			games.cancellationRateChangePoints,
			"lowerIsBetter",
			messages,
		),
		countMetric(
			"posted",
			messages.metricPosted,
			games.scheduled,
			games.scheduledPrevious,
			games.scheduledChangePercent,
			messages,
			formatters,
		),
	];
}

export function buildTrendView(
	input: TrendViewInput,
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): GamesTrendView {
	const change = changeView(input.changePercent, input.value);
	const firstCurrent = input.weeks.length - CURRENT_WEEKS[period];
	const axisMax = niceAxisMax(input.weeks.map((week) => week.value));
	return {
		total: formatters.number.format(input.value),
		change,
		comparison: formatMessage(messages.gamesComparedWith, {
			previous: formatters.number.format(input.previous),
			comparison: periodMessages.comparison,
		}),
		direction: change?.direction ?? (input.value > 0 ? "up" : "flat"),
		axisMax,
		axisLabel: axisMax === null ? null : formatters.number.format(axisMax),
		metrics: input.metrics,
		points: input.weeks.map((week, index) => {
			const weekLabel = formatters.week.format(utcDate(week.weekStart));
			const valueLabel = formatters.number.format(week.value);
			return {
				key: week.weekStart,
				value: week.value,
				valueLabel,
				weekLabel,
				tooltipLabel: formatMessage(input.tooltip, { week: weekLabel }),
				ariaLabel: formatMessage(input.pointLabel, {
					games: valueLabel,
					players: valueLabel,
					week: weekLabel,
				}),
				isCurrentPeriod: index >= firstCurrent,
			};
		}),
	};
}

export function buildGamesTrendView(
	stats: FacilityReservationStatsView,
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): GamesTrendView {
	const games = toReservationPeriodView(stats, period);
	return buildTrendView(
		{
			value: games.played,
			previous: games.playedPrevious,
			changePercent: games.playedChangePercent,
			weeks: stats.weeklyActivity.map((week) => ({
				weekStart: week.weekStart,
				value: week.gamesPlayed,
			})),
			tooltip: messages.gamesPointTooltip,
			pointLabel: messages.gamesPointLabel,
			metrics: buildGamesMetrics(games, messages, formatters),
		},
		period,
		messages,
		periodMessages,
		formatters,
	);
}

export function buildPlayersTrendView(
	stats: FacilityPlayerStatsView,
	metrics: GamesMetricView[],
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): GamesTrendView {
	const players = toPlayerPeriodView(stats, period);
	const view = buildTrendView(
		{
			value: players.activatedPlayers,
			previous: players.activatedPlayersPrevious,
			changePercent: players.activatedPlayersChangePercent,
			weeks: stats.weeklyActivatedPlayers.map((week) => ({
				weekStart: week.weekStart,
				value: week.players,
			})),
			tooltip: messages.playersPointTooltip,
			pointLabel: messages.playersPointLabel,
			metrics,
		},
		period,
		messages,
		periodMessages,
		formatters,
	);
	return { ...view, label: messages.metricActivePlayers };
}

const TREND_TONE: Record<OverallGamesTrend, InsightTone> = {
	declining: "attention",
	stable: "stable",
	growing: "growing",
};

export function buildInsightHeading(
	isToned: boolean,
	summary: MarketSummaryView | undefined,
	period: StatsPeriod,
	messages: MarketSummaryMessages,
): MarketSummaryInsightHeading {
	if (!isToned || !summary) return { title: messages.keyInsights, tone: "neutral" };
	const games = toReservationPeriodView(summary.stats, period);
	const trend = toGamesTrend(games.played, games.playedPrevious);
	const status = {
		declining: messages.trendDeclining,
		stable: messages.trendStable,
		growing: messages.trendGrowing,
	}[trend];
	return {
		title: formatMessage(messages.trendTitle, { status, title: messages.keyInsights }),
		tone: TREND_TONE[trend],
	};
}

export function utcDate(isoDate: string): Date {
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
	const audienceQuery = useMarketAudience(marketId, isRedesigned && isMarketScope);
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
	const reportStats = isMarketScope ? summary?.stats : facilityReport?.stats;
	const gamesTrend = useMemo(
		() =>
			reportStats
				? buildGamesTrendView(
						reportStats,
						period,
						messages.marketSummary,
						periodMessages,
						formatters,
					)
				: null,
		[formatters, messages.marketSummary, period, periodMessages, reportStats],
	);
	const insight = buildInsightHeading(
		isRedesigned && scope.kind === "all",
		summary,
		period,
		messages.marketSummary,
	);
	const userMetrics = useMemo(
		() =>
			buildUserMetrics(
				isMarketScope ? audienceQuery.data : undefined,
				isMarketScope && audienceQuery.isPending,
				playerStats,
				playerQuery.isPending,
				period,
				messages.marketSummary,
				formatters,
			),
		[
			audienceQuery.data,
			audienceQuery.isPending,
			formatters,
			isMarketScope,
			messages.marketSummary,
			period,
			playerQuery.isPending,
			playerStats,
		],
	);
	const playersTrend = useMemo(
		() =>
			playerStats
				? buildPlayersTrendView(
						playerStats,
						userMetrics,
						period,
						messages.marketSummary,
						periodMessages,
						formatters,
					)
				: null,
		[formatters, messages.marketSummary, period, periodMessages, playerStats, userMetrics],
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
		gamesTrend,
		heading,
		insight,
		isClosing,
		isSummaryPending:
			status === "ready" && ((isMarketScope && insightsQuery.isPending) || playerQuery.isPending),
		isInsightsFailed: isMarketScope && insightsQuery.isError,
		messages: messages.marketSummary,
		onClose,
		isUsersPending: !playerStats && playerQuery.isPending,
		playersTrend,
		userMetrics,
		marketView: isRedesigned && scope.kind === "market" ? { id: scope.id, name: scope.name } : null,
		gamesTitle: formatMessage(messages.marketSummary.gamesInPeriod, { span: periodMessages.span }),
		status,
		view: insightsView,
	};
}
