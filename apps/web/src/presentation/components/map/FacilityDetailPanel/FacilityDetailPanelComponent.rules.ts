"use client";

import type { FacilityDetailView, FacilityStatsView } from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo } from "react";
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
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityDetails } from "@/presentation/hooks/use-facility/use-facility-details";

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

export function buildSummary(
	stats: FacilityStatsView,
	messages: DetailMessages,
	formatters: DetailFormatters,
): string {
	if (stats.playedLast28Days === 0) return messages.summaryNone;
	const busiest = stats.popularTimes.reduce(
		(current, cell) => (cell.gamesPlayed > current.gamesPlayed ? cell : current),
		{ dayOfWeek: 1, timePeriod: 0, gamesPlayed: 0 },
	);
	const confirmation =
		stats.confirmationRate === null
			? messages.unavailable
			: `${formatters.decimal.format(stats.confirmationRate)}%`;
	return formatMessage(messages.summaryActivity, {
		games: formatGames(stats.playedLast28Days, messages, formatters),
		activated: formatters.number.format(stats.activatedPlayersLast28Days),
		confirmation,
		day: messages.dayLabels[busiest.dayOfWeek - 1] ?? messages.dayLabels[0] ?? "",
		period: messages.timePeriodLabels[busiest.timePeriod] ?? messages.timePeriodLabels[0] ?? "",
	});
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

export function buildTiles(
	stats: FacilityStatsView,
	messages: DetailMessages,
	formatters: DetailFormatters,
): FacilityStatTile[] {
	return [
		{
			key: "played",
			label: messages.gamesPlayed,
			value: formatters.number.format(stats.playedLast28Days),
			...periodComparison(stats.playedPeriodChangePercent, "percent", messages, formatters),
		},
		{
			key: "confirmation",
			label: messages.confirmationRate,
			value:
				stats.confirmationRate === null
					? messages.unavailable
					: `${formatters.decimal.format(stats.confirmationRate)}%`,
			...periodComparison(stats.confirmationRateChangePoints, "points", messages, formatters),
		},
		{
			key: "players",
			label: messages.uniquePlayers,
			value: formatters.number.format(stats.uniquePlayersLast28Days),
			...periodComparison(stats.uniquePlayersPeriodChangePercent, "percent", messages, formatters),
		},
		{
			key: "activated",
			label: messages.activatedPlayers,
			value: formatters.number.format(stats.activatedPlayersLast28Days),
			...periodComparison(
				stats.activatedPlayersPeriodChangePercent,
				"percent",
				messages,
				formatters,
			),
		},
	];
}

export function buildWeeklyActivity(
	stats: FacilityStatsView,
	messages: DetailMessages,
	formatters: DetailFormatters,
) {
	return stats.weeklyActivity.map((point) => {
		const label = formatters.week.format(localDate(point.weekStart));
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
	stats: FacilityStatsView,
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
				tooltip: formatMessage(messages.popularTimeTooltip, {
					day: dayLabel,
					period: periodLabel,
					games,
				}),
				intensity: value === 0 ? 0 : Math.max(1, Math.ceil((value / maximum) * 4)),
			};
		}),
	);
}

export function buildDetailViewModel(
	detail: FacilityDetailView,
	messages: DetailMessages,
	formatters: DetailFormatters,
): FacilityDetailViewModel {
	const { facility, stats } = detail;
	return {
		name: facility.name,
		address: facility.address,
		avatarUrl: facility.avatarUrl,
		summary: buildSummary(stats, messages, formatters),
		tiles: buildTiles(stats, messages, formatters),
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

export function useFacilityDetailPanelRules({
	facilityId,
	isClosing,
	onClose,
	onClosed,
}: FacilityDetailPanelProps) {
	const { locale, messages } = useMessages();
	const query = useFacilityDetails(facilityId);
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const detail = query.data;
	const view = useMemo(
		() => (detail ? buildDetailViewModel(detail, messages.facilityDetail, formatters) : null),
		[detail, messages, formatters],
	);
	const status = resolveDetailStatus(query.isPending, query.isError);

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
		detail,
		handleAnimationEnd,
		isClosing,
		messages: messages.facilityDetail,
		onClose,
		status,
		view,
	};
}
