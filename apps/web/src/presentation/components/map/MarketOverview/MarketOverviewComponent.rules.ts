"use client";

import {
	type FacilityGameChangeView,
	type MarketSummaryScopeView,
	type ReservationPeriodView,
	toGamesTrend,
	toReservationPeriodView,
} from "@market-health-map/core/application";
import { localDay } from "@market-health-map/core/domain";
import { formatMessage, type StatsPeriodMessages } from "@market-health-map/core/i18n";
import { useCallback, useMemo } from "react";
import { browserTimeZone } from "@/infrastructure/time/stats-day";
import type { MetricTone } from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";
import type { StatusTone } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.types";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import type { DetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import type {
	MarketDrivers,
	MarketHeaderView,
	MarketOverviewProps,
	MarketScorecardsView,
	MarketStatusView,
	MarketViewMessages,
	ScoreCardView,
	WeekStreak,
} from "@/presentation/components/map/MarketOverview/MarketOverviewComponent.types";
import {
	buildComparisonRange,
	buildGamesTrendView,
	directionOfChange,
	signed,
	TONE_WHEN_HIGHER,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
import type { MarketSummaryMessages } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useMarketGameInsights } from "@/presentation/hooks/use-market/use-market-game-insights";
import { useMarketSummary } from "@/presentation/hooks/use-market/use-market-summary";
import { useMarketSummaryFilters } from "@/presentation/hooks/use-market/use-market-summary-filters";

const DRIVER_SHARE = 0.75;

const MAX_DRIVERS = 3;

const STATUS_TONE: Record<ReturnType<typeof toGamesTrend>, StatusTone> = {
	declining: "attention",
	stable: "onTrack",
	growing: "growing",
};

export function weekStreak(values: number[]): WeekStreak {
	const step = (index: number) => Math.sign((values[index] ?? 0) - (values[index - 1] ?? 0));
	const last = values.length - 1;
	const sign = last >= 1 ? step(last) : 0;
	if (sign === 0) return { weeks: 0, direction: "flat" };
	let weeks = 0;
	while (last - weeks >= 1 && step(last - weeks) === sign) weeks += 1;
	return { weeks, direction: sign < 0 ? "down" : "up" };
}

export function marketDrivers(
	facilities: FacilityGameChangeView[],
	change: number,
): MarketDrivers | null {
	if (change === 0) return null;
	const total = Math.abs(change);
	const candidates = facilities
		.filter((facility) => Math.sign(facility.change) === Math.sign(change))
		.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
	const picked: FacilityGameChangeView[] = [];
	let share = 0;
	for (const facility of candidates) {
		if (picked.length >= MAX_DRIVERS || share >= total * DRIVER_SHARE) break;
		picked.push(facility);
		share += Math.abs(facility.change);
	}
	return picked.length > 0 ? { facilities: picked, share, total } : null;
}

function driversTemplate(
	change: number,
	drivers: MarketDrivers,
	messages: MarketViewMessages,
): string {
	const isOffset = drivers.share > drivers.total;
	if (change < 0) return isOffset ? messages.driversLostOffset : messages.driversLost;
	return isOffset ? messages.driversGainedOffset : messages.driversGained;
}

function headlineFor(
	name: string,
	games: ReservationPeriodView,
	streak: WeekStreak,
	messages: MarketViewMessages,
	periodMessages: StatsPeriodMessages,
): string {
	if (streak.weeks >= 2) {
		return formatMessage(streak.direction === "down" ? messages.streakDown : messages.streakUp, {
			market: name,
			weeks: streak.weeks,
		});
	}
	const trend = toGamesTrend(games.played, games.playedPrevious);
	const template = {
		[`${trend === "growing"}`]: messages.periodUp,
		[`${trend === "declining"}`]: messages.periodDown,
	}.true;
	return formatMessage(template ?? messages.periodSteady, {
		market: name,
		percent: Math.abs(Math.round(games.playedChangePercent ?? 0)),
		comparison: periodMessages.comparison,
	});
}

export function buildMarketStatus(
	name: string,
	games: ReservationPeriodView,
	weeklyGames: number[],
	facilities: FacilityGameChangeView[] | undefined,
	messages: MarketViewMessages,
	periodMessages: StatsPeriodMessages,
	locale: string,
	formatters: DetailFormatters,
): MarketStatusView {
	const number = (value: number) => formatters.number.format(value);
	const tone = STATUS_TONE[toGamesTrend(games.played, games.playedPrevious)];
	const change = games.played - games.playedPrevious;
	const drivers = facilities && tone !== "onTrack" ? marketDrivers(facilities, change) : null;
	const ending = {
		[`${drivers !== null}`]: formatMessage(messages.drivenBy, {
			count: drivers?.facilities.length ?? 0,
		}),
		[`${drivers?.facilities.length === 1}`]: messages.drivenByOne,
	}.true;
	const names = drivers?.facilities.map((facility) =>
		formatMessage(messages.driver, {
			name: facility.name,
			previous: number(facility.playedPrevious),
			current: number(facility.played),
		}),
	);
	return {
		tone,
		label: {
			attention: messages.statusAttention,
			onTrack: messages.statusOnTrack,
			growing: messages.statusGrowing,
		}[tone],
		headline: `${headlineFor(name, games, weekStreak(weeklyGames), messages, periodMessages)}${ending ?? messages.sentenceEnd}`,
		detail:
			drivers && names
				? formatMessage(driversTemplate(change, drivers, messages), {
						facilities: new Intl.ListFormat(locale, { type: "conjunction" }).format(names),
						share: number(drivers.share),
						total: number(drivers.total),
						previous: number(games.playedPrevious),
						current: number(games.played),
					})
				: null,
	};
}

function rateCard(
	label: string,
	info: string,
	rate: number | null,
	changePoints: number | null,
	polarity: keyof typeof TONE_WHEN_HIGHER,
	messages: MarketViewMessages,
): ScoreCardView {
	const rounded = changePoints === null ? null : Math.round(changePoints);
	const tone: MetricTone =
		rounded === null ? "neutral" : TONE_WHEN_HIGHER[polarity][directionOfChange(rounded)];
	return {
		label,
		info,
		value: rate === null ? "—" : `${Math.round(rate)}%`,
		change:
			rounded === null
				? null
				: {
						label: formatMessage(messages.pointsVsPrevious, {
							change: signed(rounded, String(Math.abs(rounded))),
						}),
						tone,
					},
	};
}

export function buildMarketScorecards(
	games: ReservationPeriodView,
	messages: MarketViewMessages,
	summaryMessages: MarketSummaryMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): MarketScorecardsView {
	const percent = games.playedChangePercent === null ? null : Math.round(games.playedChangePercent);
	return {
		played: {
			label: messages.gamesPlayed,
			info: messages.infoGamesPlayed,
			aside: messages.mainMetric,
			value: formatters.number.format(games.played),
			change:
				percent === null
					? null
					: {
							label: `${signed(percent, String(Math.abs(percent)))}%`,
							tone: TONE_WHEN_HIGHER.higherIsBetter[directionOfChange(percent)],
						},
			caption: formatMessage(summaryMessages.gamesComparedWith, {
				previous: formatters.number.format(games.playedPrevious),
				comparison: periodMessages.comparison,
			}),
		},
		confirmation: rateCard(
			summaryMessages.metricConfirmation,
			messages.infoConfirmation,
			games.confirmationRate,
			games.confirmationRateChangePoints,
			"higherIsBetter",
			messages,
		),
		cancellation: rateCard(
			summaryMessages.metricCancellation,
			messages.infoCancellation,
			games.cancellationRate,
			games.cancellationRateChangePoints,
			"lowerIsBetter",
			messages,
		),
	};
}

export function buildFacilitiesActive(
	scope: MarketSummaryScopeView | undefined,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): string | null {
	if (!scope) return null;
	return formatMessage(messages.facilitiesActive, {
		active: formatters.number.format(scope.activeFacilityCount),
		total: formatters.number.format(scope.facilityCount),
	});
}

export function useMarketOverviewRules({ marketId, marketName }: MarketOverviewProps) {
	const { locale, messages } = useMessages();
	const { period, setPeriod, setScope } = useMapScope();
	const { departments } = useMarketSummaryFilters();
	const summary = useMarketSummary(marketId, true, departments).data;
	const insights = useMarketGameInsights(marketId, period, !!summary, departments).data;
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const periodMessages = messages.statsPeriods[period];
	const showAllMarkets = useCallback(() => setScope({ kind: "all" }), [setScope]);

	const header = useMemo<MarketHeaderView>(
		() => ({
			breadcrumb: [
				{ key: "all", label: messages.marketSummary.allMarkets, onSelect: showAllMarkets },
				{ key: marketId, label: marketName },
			],
			breadcrumbLabel: messages.marketView.breadcrumb,
			title: marketName,
			level: messages.marketView.level,
			periodLabel: messages.statsPeriods.switchLabel,
			periodOptions: [
				{ value: "week", label: messages.statsPeriods.week.short },
				{ value: "month", label: messages.statsPeriods.month.short },
			],
			comparison: buildComparisonRange(
				localDay(new Date(), browserTimeZone()),
				period,
				locale,
				messages.marketSummary,
			),
			facilitiesActive: buildFacilitiesActive(
				summary?.periods[period].scope,
				messages.marketSummary,
				formatters,
			),
		}),
		[formatters, locale, marketId, marketName, messages, period, showAllMarkets, summary],
	);

	const facilities = insights?.find((market) => market.id === marketId)?.facilities;
	const sections = useMemo(() => {
		if (!summary) return null;
		const games = toReservationPeriodView(summary.stats, period);
		return {
			status: buildMarketStatus(
				marketName,
				games,
				summary.stats.weeklyActivity.map((week) => week.gamesPlayed),
				facilities,
				messages.marketView,
				periodMessages,
				locale,
				formatters,
			),
			scorecards: buildMarketScorecards(
				games,
				messages.marketView,
				messages.marketSummary,
				periodMessages,
				formatters,
			),
			trend: {
				...buildGamesTrendView(
					summary.stats,
					period,
					messages.marketSummary,
					periodMessages,
					formatters,
				),
				metrics: [],
			},
		};
	}, [facilities, formatters, locale, marketName, messages, period, periodMessages, summary]);

	return {
		facilities,
		header,
		period,
		scorecardsTitle: messages.marketView.scorecards,
		trendAside: messages.marketView.trendAside,
		trendTitle: messages.marketView.trendTitle,
		sections,
		setPeriod,
	};
}
