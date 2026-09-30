"use client";

import type {
	ActivityCounter,
	AppMetricsPeoplePage,
	AppMetricsView,
} from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useMemo, useState } from "react";
import {
	createDetailFormatters,
	resolveDetailStatus,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import {
	ChangeDirection,
	type DetailFormatters,
	type FacilityStatTile,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useAppMetrics } from "@/presentation/hooks/use-metrics/use-app-metrics";
import { useAppMetricsPeople } from "@/presentation/hooks/use-metrics/use-app-metrics-people";
import type {
	AppMetricsMessages,
	AppMetricsPersonRow,
	AppMetricsStatus,
	AppMetricsWeeklySeries,
} from "@/presentation/screens/AppMetricsScreen/AppMetricsScreenComponent.types";

function day(isoDay: string): Date {
	return new Date(`${isoDay}T00:00:00Z`);
}

export function goalDirection(metrics: AppMetricsView): FacilityStatTile["hintDirection"] {
	const direction = {
		[`${true}`]: ChangeDirection.flat,
		[`${metrics.targetCount > 0}`]: ChangeDirection.down,
		[`${metrics.isGoalMet}`]: ChangeDirection.up,
	}.true;
	return direction as FacilityStatTile["hintDirection"];
}

export function buildMetricTiles(
	metrics: AppMetricsView,
	messages: AppMetricsMessages,
	formatters: DetailFormatters,
): FacilityStatTile[] {
	const number = (value: number) => formatters.number.format(value);
	return [
		{
			key: "goal",
			label: messages.weeklyGoal,
			value: `${formatters.decimal.format(metrics.targetPercent)}%`,
			hint: formatMessage(messages.goalHint, {
				active: number(metrics.activeTargetCount),
				total: number(metrics.targetCount),
				goal: number(metrics.goalPercent),
			}),
			hintDirection: goalDirection(metrics),
			isLoading: false,
		},
		{
			key: "active",
			label: messages.activeUsers,
			value: number(metrics.activeUserCount),
			hint: messages.activeUsersHint,
			hintDirection: ChangeDirection.flat,
			isLoading: false,
		},
		{
			key: "not-yet",
			label: messages.notYet,
			value: number(metrics.inactiveTargets.length),
			hint: metrics.inactiveTargets.length === 0 ? messages.notYetNone : null,
			hintDirection: ChangeDirection.flat,
			isLoading: false,
		},
	];
}

export function buildWeeklyPoints(
	metrics: AppMetricsView,
	messages: AppMetricsMessages,
	formatters: DetailFormatters,
): AppMetricsWeeklySeries {
	const weeks = metrics.weeks.map((week) => ({
		week,
		label: formatters.week.format(day(week.weekStart)),
	}));
	const point = (key: string, label: string, value: number, tooltip: string) => ({
		key,
		label,
		shortLabel: label,
		value,
		valueLabel: formatters.number.format(value),
		tooltip,
	});
	return {
		all: weeks.map(({ week, label }) =>
			point(
				week.weekStart,
				label,
				week.activeUserCount,
				formatMessage(messages.chartAllTooltip, {
					week: label,
					active: formatters.number.format(week.activeUserCount),
				}),
			),
		),
		targets: weeks.map(({ week, label }) =>
			point(
				week.weekStart,
				label,
				week.activeTargetCount,
				formatMessage(messages.chartTooltip, {
					week: label,
					percent: formatters.decimal.format(week.targetPercent),
					active: formatters.number.format(week.activeTargetCount),
					total: formatters.number.format(metrics.targetCount),
				}),
			),
		),
	};
}

export function featureLabel(
	feature: ActivityCounter | null,
	messages: AppMetricsMessages,
): string {
	if (!feature) return messages.noFeature;
	return {
		facilitiesOpened: messages.featureFacilitiesOpened,
		marketSummariesOpened: messages.featureMarketSummariesOpened,
		searches: messages.featureSearches,
		aiSummaries: messages.featureAiSummaries,
		feedbackSent: messages.featureFeedbackSent,
	}[feature];
}

export function buildPeopleRows(
	people: AppMetricsPeoplePage,
	messages: AppMetricsMessages,
	formatters: DetailFormatters,
): AppMetricsPersonRow[] {
	return people.rows.map((person) => ({
		key: person.email,
		name: person.name ?? person.email,
		email: person.name ? person.email : null,
		isTarget: person.isTarget,
		days: formatters.number.format(person.daysActive),
		visits: formatters.number.format(person.visits),
		minutes: formatters.number.format(person.minutes),
		topFeature: featureLabel(person.topFeature, messages),
		lastSeen: person.lastSeenAt
			? formatters.dayWithYear.format(new Date(person.lastSeenAt))
			: messages.neverSeen,
	}));
}

export function useAppMetricsScreenRules() {
	const { locale, messages } = useMessages();
	const [page, setPage] = useState(1);
	const metricsQuery = useAppMetrics();
	const peopleQuery = useAppMetricsPeople(page);
	const formatters = useMemo(() => createDetailFormatters(locale), [locale]);
	const appMessages = messages.appMetrics;
	const metrics = metricsQuery.data;
	const people = peopleQuery.data;
	const view = useMemo(
		() =>
			metrics
				? {
						tiles: buildMetricTiles(metrics, appMessages, formatters),
						weekly: buildWeeklyPoints(metrics, appMessages, formatters),
					}
				: null,
		[appMessages, formatters, metrics],
	);
	const rows = useMemo(
		() => (people ? buildPeopleRows(people, appMessages, formatters) : []),
		[appMessages, formatters, people],
	);
	const pageCount = people?.pageCount ?? 1;
	const status: AppMetricsStatus = resolveDetailStatus(
		metricsQuery.isPending,
		metricsQuery.isError,
	);

	return {
		messages: appMessages,
		page,
		pageCount,
		pageLabel: formatMessage(appMessages.pageOf, {
			page: formatters.number.format(page),
			pageCount: formatters.number.format(pageCount),
		}),
		rows,
		setPage,
		status,
		view,
	};
}
