"use client";

import {
	type FacilityGameChangeView,
	type FacilityLowReviewView,
	type FacilityQualityPeriodView,
	toReservationPeriodView,
} from "@market-health-map/core/application";
import { localDay } from "@market-health-map/core/domain";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useMemo } from "react";
import { browserTimeZone } from "@/infrastructure/time/stats-day";
import type { GamesMetricView } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import type { ScopeHeaderView } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent.types";
import { createDetailFormatters } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import type {
	FacilityMetricsSectionView,
	FacilityOverviewProps,
	FacilitySatisfactionView,
	FacilityViewMessages,
} from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.types";
import {
	buildMarketScorecards,
	buildMarketStatus,
} from "@/presentation/components/map/MarketOverview/MarketOverviewComponent.rules";
import {
	buildComparisonRange,
	buildGamesTrendView,
	directionOfChange,
	pendingMetric,
	rateMetric,
	signed,
	TONE_WHEN_HIGHER,
	utcDate,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
import type { MarketSummaryMessages } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityQuality } from "@/presentation/hooks/use-facility/use-facility-quality";
import { useFacilityReservationStats } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";
import { useMarketGameInsights } from "@/presentation/hooks/use-market/use-market-game-insights";

const NO_DEPARTMENTS: [] = [];

export function buildFacilityRank(
	facilityId: string,
	facilities: FacilityGameChangeView[] | undefined,
	marketName: string,
	messages: FacilityViewMessages,
	number: Intl.NumberFormat,
): FacilityMetricsSectionView | null {
	const listed = (facilities ?? []).filter(
		(facility) => facility.played > 0 || facility.playedPrevious > 0,
	);
	const self = listed.find((facility) => facility.id === facilityId);
	if (!self) return null;
	const total = formatMessage(messages.rankOf, { total: number.format(listed.length) });
	const rankRow = (key: string, label: string, above: number): GamesMetricView => ({
		key,
		label,
		value: formatMessage(messages.rankValue, { rank: number.format(above + 1) }),
		previous: total,
		change: null,
	});
	return {
		title: formatMessage(messages.rankTitle, { market: marketName }),
		rows: [
			rankRow(
				"games",
				messages.rankByGames,
				listed.filter((facility) => facility.played > self.played).length,
			),
			rankRow(
				"change",
				messages.rankByChange,
				listed.filter((facility) => facility.change > self.change).length,
			),
		],
	};
}

export function averageMetric(
	key: string,
	label: string,
	value: number | null,
	previous: number | null,
	polarity: keyof typeof TONE_WHEN_HIGHER,
	summaryMessages: MarketSummaryMessages,
	formatter: Intl.NumberFormat,
): GamesMetricView {
	const format = (amount: number | null) => (amount === null ? "—" : formatter.format(amount));
	const digits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
	const difference =
		value === null || previous === null ? null : Number((value - previous).toFixed(digits));
	const direction = difference === null ? null : directionOfChange(difference);
	return {
		key,
		label,
		value: format(value),
		previous: formatMessage(summaryMessages.metricVs, { value: format(previous) }),
		change:
			difference === null || direction === null
				? null
				: {
						label: signed(difference, formatter.format(Math.abs(difference))),
						direction,
						tone: TONE_WHEN_HIGHER[polarity][direction],
					},
	};
}

function pointsBetween(current: number | null, previous: number | null): number | null {
	return current === null || previous === null ? null : current - previous;
}

export function buildFacilityDemand(
	quality: FacilityQualityPeriodView,
	messages: FacilityViewMessages,
	summaryMessages: MarketSummaryMessages,
	locale: string,
): FacilityMetricsSectionView {
	return {
		title: messages.demandTitle,
		rows: [
			averageMetric(
				"averagePlayers",
				messages.averagePlayers,
				quality.averagePlayersPerGame,
				quality.averagePlayersPerGamePrevious,
				"higherIsBetter",
				summaryMessages,
				new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
			),
			rateMetric(
				"waitlist",
				messages.waitlistGames,
				quality.waitlistGamesRate,
				quality.waitlistGamesRatePrevious,
				pointsBetween(quality.waitlistGamesRate, quality.waitlistGamesRatePrevious),
				"higherIsBetter",
				summaryMessages,
			),
			rateMetric(
				"almostFilled",
				messages.almostFilled,
				quality.almostFilledRate,
				quality.almostFilledRatePrevious,
				pointsBetween(quality.almostFilledRate, quality.almostFilledRatePrevious),
				"lowerIsBetter",
				summaryMessages,
			),
		],
	};
}

export function buildFacilitySatisfaction(
	quality: FacilityQualityPeriodView,
	lowReviews: FacilityLowReviewView[],
	messages: FacilityViewMessages,
	summaryMessages: MarketSummaryMessages,
	locale: string,
): FacilitySatisfactionView {
	const rating = new Intl.NumberFormat(locale, {
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	});
	const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
	return {
		title: messages.satisfactionTitle,
		rows: [
			averageMetric(
				"averageRating",
				messages.averageRating,
				quality.averageRating,
				quality.averageRatingPrevious,
				"higherIsBetter",
				summaryMessages,
				rating,
			),
			rateMetric(
				"incidentGames",
				messages.incidentGames,
				quality.incidentGamesRate,
				quality.incidentGamesRatePrevious,
				pointsBetween(quality.incidentGamesRate, quality.incidentGamesRatePrevious),
				"lowerIsBetter",
				summaryMessages,
			),
			rateMetric(
				"returningPlayers",
				messages.returningPlayers,
				quality.returningPlayersRate,
				quality.returningPlayersRatePrevious,
				pointsBetween(quality.returningPlayersRate, quality.returningPlayersRatePrevious),
				"higherIsBetter",
				summaryMessages,
			),
		],
		footnote:
			quality.ratingCount > 0
				? formatMessage(messages.ratingCount, {
						count: new Intl.NumberFormat(locale).format(quality.ratingCount),
					})
				: null,
		reviewsTitle: messages.lowReviewsTitle,
		reviews: lowReviews.map((review) => ({
			id: review.id,
			rate: formatMessage(messages.reviewRate, { rate: review.rate }),
			date: date.format(utcDate(review.date)),
			title: review.title?.trim() || messages.untitledReview,
		})),
		emptyReviews: messages.noLowReviews,
	};
}

function pendingSection(title: string, labels: string[]): FacilityMetricsSectionView {
	return { title, rows: labels.map((label) => pendingMetric(label, label)) };
}

export function useFacilityOverviewRules({
	facilityId,
	facilityName,
	marketName,
}: FacilityOverviewProps) {
	const { locale, messages } = useMessages();
	const { period, setMapNavigation, setPeriod, setScope } = useMapScope();
	const report = useFacilityReservationStats(facilityId).data;
	const marketId = report?.facility.marketId ?? null;
	const insights = useMarketGameInsights(marketId, period, marketId !== null, NO_DEPARTMENTS).data;
	const quality = useFacilityQuality(facilityId).data;
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const periodMessages = messages.statsPeriods[period];
	const facilityMessages = messages.facilityView;

	const showAllMarkets = useCallback(() => setScope({ kind: "all" }), [setScope]);
	const showMarket = useCallback(() => {
		if (marketId) setMapNavigation({ kind: "market", id: marketId, name: marketName });
	}, [marketId, marketName, setMapNavigation]);

	const header = useMemo<ScopeHeaderView>(
		() => ({
			breadcrumb: [
				{ key: "all", label: messages.marketSummary.allMarkets, onSelect: showAllMarkets },
				{ key: "market", label: marketName, onSelect: marketId ? showMarket : undefined },
				{ key: facilityId, label: facilityName },
			],
			breadcrumbLabel: messages.marketView.breadcrumb,
			title: facilityName,
			level: facilityMessages.level,
			subtitle: report?.facility.address ?? null,
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
			footnote: null,
		}),
		[
			facilityId,
			facilityMessages.level,
			facilityName,
			locale,
			marketId,
			marketName,
			messages,
			period,
			report?.facility.address,
			showAllMarkets,
			showMarket,
		],
	);

	const sections = useMemo(() => {
		if (!report) return null;
		const games = toReservationPeriodView(report.stats, period);
		return {
			status: buildMarketStatus(
				facilityName,
				games,
				report.stats.weeklyActivity.map((week) => week.gamesPlayed),
				undefined,
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
					report.stats,
					period,
					messages.marketSummary,
					periodMessages,
					formatters,
				),
				metrics: [],
			},
		};
	}, [facilityName, formatters, locale, messages, period, periodMessages, report]);

	const rank = useMemo(
		() =>
			buildFacilityRank(
				facilityId,
				insights?.[0]?.facilities,
				marketName,
				facilityMessages,
				formatters.number,
			),
		[facilityId, facilityMessages, formatters.number, insights, marketName],
	);

	const demand = useMemo(
		() =>
			quality
				? buildFacilityDemand(
						quality.periods[period],
						facilityMessages,
						messages.marketSummary,
						locale,
					)
				: pendingSection(facilityMessages.demandTitle, [
						facilityMessages.averagePlayers,
						facilityMessages.waitlistGames,
						facilityMessages.almostFilled,
					]),
		[facilityMessages, locale, messages.marketSummary, period, quality],
	);

	const satisfaction = useMemo(
		() =>
			quality
				? buildFacilitySatisfaction(
						quality.periods[period],
						quality.lowReviews,
						facilityMessages,
						messages.marketSummary,
						locale,
					)
				: null,
		[facilityMessages, locale, messages.marketSummary, period, quality],
	);

	return {
		demand,
		header,
		period,
		rank,
		satisfaction,
		satisfactionPending: pendingSection(facilityMessages.satisfactionTitle, [
			facilityMessages.averageRating,
			facilityMessages.incidentGames,
			facilityMessages.returningPlayers,
		]),
		scorecardsTitle: messages.marketView.scorecards,
		sections,
		setPeriod,
		trendAside: messages.marketView.trendAside,
		trendTitle: messages.marketView.trendTitle,
	};
}
