"use client";

import {
	type ActivityPeriodView,
	type FacilityPlayerStatsView,
	type FacilityReservationDetailView,
	type FacilityReservationStatsView,
	type PlayerPeriodView,
	type ReservationPeriodView,
	type StatsPeriod,
	toPlayerPeriodView,
	toReservationPeriodView,
} from "@market-health-map/core/application";
import { GAMES_WINDOW_DAYS, type GamesTrend, weekEndOf } from "@market-health-map/core/domain";
import {
	formatMessage,
	type Messages,
	type StatsPeriodMessages,
} from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo } from "react";
import { aiSummaryContextFor } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import {
	ChangeDirection,
	type DetailFormatters,
	type DetailMessages,
	type FacilityDetailPanelProps,
	type FacilityDetailStatus,
	type FacilityDetailViewModel,
	type FacilityStatTile,
	type StatDirection,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityPlayerStats } from "@/presentation/hooks/use-facility/use-facility-player-stats";
import { useFacilityReservationStats } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";
import { useFeatureFlag } from "@/presentation/hooks/use-feature-flags/use-feature-flags";

export function createDetailFormatters(locale: string): DetailFormatters {
	return {
		number: new Intl.NumberFormat(locale),
		decimal: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
		plural: new Intl.PluralRules(locale),
		dayWithYear: new Intl.DateTimeFormat(locale, {
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		}),
		week: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }),
		weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }),
		weekdayDate: new Intl.DateTimeFormat(locale, {
			weekday: "short",
			month: "short",
			day: "numeric",
			timeZone: "UTC",
		}),
	};
}

function localDate(isoDate: string): Date {
	return new Date(`${isoDate}T00:00:00Z`);
}

export function formatGames(count: number, messages: DetailMessages, formatters: DetailFormatters) {
	const template =
		formatters.plural.select(count) === "one" ? messages.gamesOne : messages.gamesOther;
	return formatMessage(template, { count: formatters.number.format(count) });
}

export function directionOf(change: number | null): StatDirection {
	const direction = {
		[`${true}`]: ChangeDirection.flat,
		[`${(change ?? 0) > 0}`]: ChangeDirection.up,
		[`${(change ?? 0) < 0}`]: ChangeDirection.down,
	}.true;
	return direction as StatDirection;
}

export function activityPeriodFor(
	reservationStats: FacilityReservationStatsView,
	playerStats: FacilityPlayerStatsView,
	period: StatsPeriod,
): ActivityPeriodView {
	return {
		...toReservationPeriodView(reservationStats, period),
		...toPlayerPeriodView(playerStats, period),
	};
}

export function buildSummary(
	stats: ActivityPeriodView,
	messages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): string {
	if (stats.played === 0) {
		return formatMessage(messages.summaryNone, { within: periodMessages.within });
	}
	const signals = [
		{
			label: messages.gamesPlayed,
			change: stats.playedChangePercent,
			previous: stats.playedPrevious,
			current: stats.played,
		},
		{
			label: messages.uniquePlayers,
			change: stats.uniquePlayersChangePercent,
			previous: stats.uniquePlayersPrevious,
			current: stats.uniquePlayers,
		},
		{
			label: messages.activatedPlayers,
			change: stats.activatedPlayersChangePercent,
			previous: stats.activatedPlayersPrevious,
			current: stats.activatedPlayers,
		},
	]
		.filter((signal) => signal.change !== null && signal.change !== 0)
		.sort((left, right) => Math.abs(right.change ?? 0) - Math.abs(left.change ?? 0))
		.slice(0, 2);
	if (signals.length === 0) return messages.insightsNone;
	return signals
		.map((signal) =>
			formatMessage(messages.insightChange, {
				metric: signal.label,
				change: formatters.decimal.format(signal.change ?? 0),
				comparison: periodMessages.comparison,
				previous: formatters.number.format(signal.previous),
				current: formatters.number.format(signal.current),
			}),
		)
		.join(" ");
}

function periodComparison(
	change: number | null,
	unit: "percent" | "points",
	messages: DetailMessages,
	formatters: DetailFormatters,
): Pick<FacilityStatTile, "hint" | "hintDirection"> {
	const hintDirection = directionOf(change);
	if (change === null) return { hint: null, hintDirection };
	const sign = { up: "+", down: "", flat: "" }[hintDirection];
	const suffix = { percent: "%", points: "" }[unit];
	const amount = `${sign}${formatters.decimal.format(change)}${suffix}`;
	const template = {
		percent: messages.vsPreviousPeriod,
		points: messages.vsPreviousPeriodPoints,
	}[unit];
	return { hint: formatMessage(template, { change: amount }), hintDirection };
}

export function buildProgressiveTiles(
	reservationStats: ReservationPeriodView,
	playerStats: PlayerPeriodView | undefined,
	isPlayerPending: boolean,
	messages: DetailMessages,
	formatters: DetailFormatters,
): FacilityStatTile[] {
	const reservationTiles: FacilityStatTile[] = [
		{
			key: "played",
			label: messages.gamesPlayed,
			value: formatters.number.format(reservationStats.played),
			...periodComparison(reservationStats.playedChangePercent, "percent", messages, formatters),
			isLoading: false,
		},
		{
			key: "confirmation",
			label: messages.confirmationRate,
			value:
				reservationStats.confirmationRate === null
					? messages.unavailable
					: `${formatters.decimal.format(reservationStats.confirmationRate)}%`,
			...periodComparison(
				reservationStats.confirmationRateChangePoints,
				"points",
				messages,
				formatters,
			),
			isLoading: false,
		},
	];
	if (!playerStats) {
		const value = isPlayerPending ? "" : messages.unavailable;
		return [
			...reservationTiles,
			{
				key: "players",
				label: messages.uniquePlayers,
				value,
				hint: null,
				hintDirection: ChangeDirection.flat,
				isLoading: isPlayerPending,
			},
			{
				key: "activated",
				label: messages.activatedPlayers,
				value,
				hint: null,
				hintDirection: ChangeDirection.flat,
				isLoading: isPlayerPending,
			},
		];
	}
	return [
		...reservationTiles,
		{
			key: "players",
			label: messages.uniquePlayers,
			value: formatters.number.format(playerStats.uniquePlayers),
			...periodComparison(playerStats.uniquePlayersChangePercent, "percent", messages, formatters),
			isLoading: false,
		},
		{
			key: "activated",
			label: messages.activatedPlayers,
			value: formatters.number.format(playerStats.activatedPlayers),
			...periodComparison(
				playerStats.activatedPlayersChangePercent,
				"percent",
				messages,
				formatters,
			),
			isLoading: false,
		},
	];
}

export const CLASSIC_WEEKLY_POINTS = 4;

export function buildWeeklyActivity(
	stats: FacilityReservationStatsView,
	messages: DetailMessages,
	formatters: DetailFormatters,
) {
	return stats.weeklyActivity.slice(-CLASSIC_WEEKLY_POINTS).map((point) => {
		const label = formatters.week.format(localDate(weekEndOf(point.weekStart)));
		const games = formatGames(point.gamesPlayed, messages, formatters);
		return {
			key: point.weekStart,
			label,
			shortLabel: label,
			value: point.gamesPlayed,
			valueLabel: games,
			tooltip: formatMessage(messages.weeklyActivityTooltip, { week: label, games }),
		};
	});
}

export function buildPopularTimes(
	stats: FacilityReservationStatsView,
	messages: DetailMessages,
	formatters: DetailFormatters,
) {
	const maximum = Math.max(1, ...stats.popularTimes.map((cell) => cell.gamesPlayed));
	return messages.timePeriodLabels.flatMap((periodLabel, timePeriod) =>
		messages.dayLabels.map((dayLabel, dayIndex) => {
			const dayOfWeek = dayIndex + 1;
			const value =
				stats.popularTimes.find(
					(cell) => cell.dayOfWeek === dayOfWeek && cell.timePeriod === timePeriod,
				)?.gamesPlayed ?? 0;
			const games = formatGames(value, messages, formatters);
			return {
				key: `${dayOfWeek}-${timePeriod}`,
				dayLabel,
				periodLabel,
				value,
				label: formatMessage(messages.popularTimeCellLabel, {
					day: dayLabel,
					period: periodLabel,
					games,
				}),
				tooltip: games,
				intensity: value === 0 ? 0 : Math.max(1, Math.ceil((value / maximum) * 4)),
			};
		}),
	);
}

export function buildProgressiveDetailViewModel(
	detail: FacilityReservationDetailView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	period: StatsPeriod,
	messages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): FacilityDetailViewModel {
	const { facility, stats } = detail;
	const reservationPeriod = toReservationPeriodView(stats, period);
	const playerPeriod = playerStats ? toPlayerPeriodView(playerStats, period) : undefined;
	return {
		name: facility.name,
		address: facility.address,
		avatarUrl: facility.avatarUrl,
		summary: playerPeriod
			? buildSummary(
					{ ...reservationPeriod, ...playerPeriod },
					messages,
					periodMessages,
					formatters,
				)
			: null,
		tiles: buildProgressiveTiles(
			reservationPeriod,
			playerPeriod,
			isPlayerPending,
			messages,
			formatters,
		),
		weeklyActivity: buildWeeklyActivity(stats, messages, formatters),
		popularTimes: buildPopularTimes(stats, messages, formatters),
		dayLabels: [...messages.dayLabels],
		timePeriodLabels: [...messages.timePeriodLabels],
		lastPlayedLabel: stats.lastPlayedDate
			? formatMessage(messages.lastPlayed, {
					date: formatters.dayWithYear.format(localDate(stats.lastPlayedDate)),
				})
			: messages.neverPlayed,
	};
}

export function resolveDetailStatus(isPending: boolean, isError: boolean): FacilityDetailStatus {
	const status = { [`${!isPending}`]: "ready", [`${isError}`]: "error" }.true;
	return (status ?? "loading") as FacilityDetailStatus;
}

export function formatGamesTrendPanel(
	trend: GamesTrend,
	messages: Messages["map"]["trend"],
	days = GAMES_WINDOW_DAYS,
) {
	const percent = trend.percentChange;
	const current = formatMessage(trend.current === 1 ? messages.gamesOne : messages.gamesOther, {
		count: trend.current,
	});
	return {
		title: messages.panelTitle,
		compare: formatMessage(messages.panelCompare, { current, previous: trend.previous, days }),
		change:
			percent === null
				? formatMessage(messages.panelNoPrevious, { days })
				: formatMessage(messages.panelChange, {
						change: `${percent > 0 ? "+" : ""}${percent}`,
						days,
					}),
	};
}

export function useFacilityDetailPanelRules({
	facilityId,
	isClosing,
	onClose,
	onClosed,
	trend,
}: FacilityDetailPanelProps) {
	const { locale, messages } = useMessages();
	const { period } = useMapScope();
	const reservationQuery = useFacilityReservationStats(facilityId);
	const playerQuery = useFacilityPlayerStats(facilityId);
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const reservationDetail = reservationQuery.data;
	const playerStats = playerQuery.data;
	const periodMessages = messages.statsPeriods[period];
	const view = useMemo(
		() =>
			reservationDetail
				? buildProgressiveDetailViewModel(
						reservationDetail,
						playerStats,
						playerQuery.isPending,
						period,
						messages.facilityDetail,
						periodMessages,
						formatters,
					)
				: null,
		[
			formatters,
			messages.facilityDetail,
			period,
			periodMessages,
			playerQuery.isPending,
			playerStats,
			reservationDetail,
		],
	);
	const aiContext = useMemo(
		() =>
			reservationDetail && playerStats
				? aiSummaryContextFor(
						{
							kind: "facility",
							id: reservationDetail.facility.id,
							name: reservationDetail.facility.name,
							stats: activityPeriodFor(reservationDetail.stats, playerStats, period),
						},
						locale,
					)
				: null,
		[locale, period, playerStats, reservationDetail],
	);
	const status = resolveDetailStatus(reservationQuery.isPending, reservationQuery.isError);
	const isRedesigned = useFeatureFlag("insights-panel-v3");
	const overview =
		isRedesigned && reservationDetail
			? {
					facilityId: reservationDetail.facility.id,
					facilityName: reservationDetail.facility.name,
					marketName: reservationDetail.facility.marketName,
				}
			: null;

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
		handleAnimationEnd,
		isAiPending: status === "ready" && playerQuery.isPending,
		isClosing,
		messages: messages.facilityDetail,
		onClose,
		overview,
		status,
		trend: trend
			? { level: trend.level, ...formatGamesTrendPanel(trend, messages.map.trend) }
			: null,
		view,
	};
}
