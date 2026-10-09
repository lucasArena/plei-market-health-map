"use client";

import { toReservationPeriodView } from "@market-health-map/core/application";
import { localDay } from "@market-health-map/core/domain";
import { useCallback, useMemo } from "react";
import { browserTimeZone } from "@/infrastructure/time/stats-day";
import type { ScopeHeaderView } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent.types";
import {
	buildPopularTimes,
	createDetailFormatters,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import type { FacilityOverviewProps } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.types";
import {
	buildMarketScorecards,
	buildMarketStatus,
} from "@/presentation/components/map/MarketOverview/MarketOverviewComponent.rules";
import {
	buildComparisonRange,
	buildGamesTrendView,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityReservationStats } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";

export function useFacilityOverviewRules({
	facilityId,
	facilityName,
	marketName,
}: FacilityOverviewProps) {
	const { locale, messages } = useMessages();
	const { period, setMapNavigation, setScope } = useMapScope();
	const report = useFacilityReservationStats(facilityId).data;
	const marketId = report?.facility.marketId ?? null;
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

	const popularTimes = useMemo(
		() =>
			report
				? {
						title: messages.facilityDetail.popularTimes,
						dayLabels: [...messages.facilityDetail.dayLabels],
						periodLabels: [...messages.facilityDetail.timePeriodLabels],
						periodRanges: messages.facilityDetail.timePeriodRanges,
						cells: buildPopularTimes(report.stats, messages.facilityDetail, formatters),
						quietLabel: messages.facilityDetail.quiet,
						busyLabel: messages.facilityDetail.busy,
					}
				: null,
		[formatters, messages.facilityDetail, report],
	);

	return {
		header,
		popularTimes,
		scorecardsTitle: messages.marketView.scorecards,
		sections,
		trendAside: messages.marketView.trendAside,
		trendTitle: messages.marketView.trendTitle,
	};
}
