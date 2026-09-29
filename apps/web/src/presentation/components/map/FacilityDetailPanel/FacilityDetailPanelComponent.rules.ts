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
		day: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }),
		dayWithYear: new Intl.DateTimeFormat(locale, {
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC",
		}),
	};
}

function localDate(isoDate: string): Date {
	return new Date(`${isoDate}T00:00:00Z`);
}

function addDays(isoDate: string, days: number): Date {
	return new Date(localDate(isoDate).getTime() + days * 86_400_000);
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
	return formatMessage(messages.summaryPlayed, {
		games: formatGames(stats.playedLast28Days, messages, formatters),
		start: formatters.day.format(addDays(stats.weekStart, -21)),
		end: formatters.dayWithYear.format(addDays(stats.weekStart, 6)),
	});
}

export function buildTiles(
	stats: FacilityStatsView,
	messages: DetailMessages,
	formatters: DetailFormatters,
): FacilityStatTile[] {
	const change = stats.playedChangePercent;
	const sign = { up: "+", down: "", flat: "" }[directionOf(change)];
	const signedChange = change === null ? null : `${sign}${formatters.decimal.format(change)}%`;
	return [
		{
			key: "played",
			label: messages.playedLastWeek,
			value: formatters.number.format(stats.playedLastWeek),
			hint: signedChange ? formatMessage(messages.vsPreviousWeek, { change: signedChange }) : null,
			hintDirection: directionOf(change),
		},
		{
			key: "scheduled",
			label: messages.scheduled,
			value: formatters.number.format(stats.scheduledLastWeek),
			hint: null,
			hintDirection: ChangeDirection.flat,
		},
		{
			key: "cancelled",
			label: messages.cancelled,
			value: formatters.number.format(stats.cancelledLastWeek),
			hint:
				stats.cancellationRate === null
					? null
					: formatMessage(messages.cancellationRate, {
							rate: formatters.decimal.format(stats.cancellationRate),
						}),
			hintDirection: ChangeDirection.flat,
		},
		{
			key: "upcoming",
			label: messages.nextSevenDays,
			value: formatters.number.format(stats.upcomingNextSevenDays),
			hint: null,
			hintDirection: ChangeDirection.flat,
		},
	];
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
		weekLabel: formatMessage(messages.weekRange, {
			start: formatters.day.format(localDate(stats.weekStart)),
			end: formatters.dayWithYear.format(addDays(stats.weekStart, 6)),
		}),
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
