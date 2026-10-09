"use client";

import type {
	AudiencePeriodView,
	FacilityPlayerStatsView,
	FacilityReservationStatsView,
	PlayerPeriodView,
	ReservationPeriodView,
	StatsPeriod,
} from "@market-health-map/core/application";
import { weekEndOf } from "@market-health-map/core/domain";
import {
	formatMessage,
	type Messages,
	type StatsPeriodMessages,
} from "@market-health-map/core/i18n";
import { useId, useMemo } from "react";
import {
	type GamesCardView,
	type GamesChartView,
	type GamesMetricChangeView,
	type GamesMetricRowView,
	type GamesMetricsMessages,
	GamesMetricTone,
	type GamesSeriesPointView,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import type {
	DetailFormatters,
	DetailMessages,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";

const MINUS_SIGN = "\u2212";

function signed(magnitude: string, value: number): string {
	if (value > 0) return `+${magnitude}`;
	if (value < 0) return `${MINUS_SIGN}${magnitude}`;
	return magnitude;
}

function rateOf(part: number, whole: number): number | null {
	if (whole <= 0) return null;
	return Math.round((part / whole) * 1000) / 10;
}

function localDate(isoDate: string): Date {
	return new Date(`${isoDate}T00:00:00Z`);
}

/**
 * Builds the pill for one metric. `higherIsBetter` turns a raw rise or fall into
 * better/worse, so a cancellation increase is red and a games increase is green.
 */
export function buildGamesMetricChange(
	change: number | null,
	unit: "percent" | "points",
	higherIsBetter: boolean,
	messages: GamesMetricsMessages,
	formatters: DetailFormatters,
): GamesMetricChangeView | null {
	if (change === null) return null;
	const rounded = unit === "percent" ? Math.round(change) : Math.round(change * 10) / 10;
	const format = unit === "percent" ? formatters.number : formatters.decimal;
	const amount = signed(format.format(Math.abs(rounded)), rounded);
	const label =
		unit === "percent"
			? `${amount}%`
			: formatMessage(messages.gamesChangePoints, { change: amount });
	if (rounded === 0) {
		return {
			direction: "flat",
			tone: GamesMetricTone.flat,
			label,
			description: messages.gamesChangeSame,
		};
	}
	const isBetter = rounded > 0 === higherIsBetter;
	return {
		direction: rounded > 0 ? "up" : "down",
		tone: isBetter ? GamesMetricTone.better : GamesMetricTone.worse,
		label,
		description: formatMessage(isBetter ? messages.gamesChangeBetter : messages.gamesChangeWorse, {
			change: label,
		}),
	};
}

function versus(previous: string, messages: GamesMetricsMessages): string {
	return formatMessage(messages.gamesVersusPrevious, { previous });
}

/**
 * Confirmation, cancellation and posted, in the design's order. Rows the API cannot
 * support are left out rather than shown with made-up numbers.
 */
export function buildGamesMetricRows(
	reservations: ReservationPeriodView,
	messages: GamesMetricsMessages,
	detailMessages: Pick<DetailMessages, "confirmationRate">,
	formatters: DetailFormatters,
): GamesMetricRowView[] {
	const percent = (value: number) => `${formatters.decimal.format(value)}%`;
	const rows: GamesMetricRowView[] = [];
	if (reservations.confirmationRate !== null) {
		const previousRate = rateOf(reservations.playedPrevious, reservations.scheduledPrevious);
		rows.push({
			key: "confirmation",
			label: detailMessages.confirmationRate,
			value: percent(reservations.confirmationRate),
			previousLabel: previousRate === null ? null : versus(percent(previousRate), messages),
			change: buildGamesMetricChange(
				reservations.confirmationRateChangePoints,
				"points",
				true,
				messages,
				formatters,
			),
		});
	}
	// Cancelled games / posted games in the selected period (7 or 28 days), compared
	// with the period before; a rise is worse. Hidden when nothing was posted.
	if (reservations.cancellationRate !== null) {
		rows.push({
			key: "cancellation",
			label: messages.cancellationRate,
			value: percent(reservations.cancellationRate),
			previousLabel:
				reservations.cancellationRatePrevious === null
					? null
					: versus(percent(reservations.cancellationRatePrevious), messages),
			change: buildGamesMetricChange(
				reservations.cancellationRateChangePoints,
				"points",
				false,
				messages,
				formatters,
			),
		});
	}
	rows.push({
		key: "posted",
		label: messages.gamesPosted,
		value: formatters.number.format(reservations.scheduled),
		previousLabel: versus(formatters.number.format(reservations.scheduledPrevious), messages),
		change: buildGamesMetricChange(
			reservations.scheduledChangePercent,
			"percent",
			true,
			messages,
			formatters,
		),
	});
	return rows;
}

interface SeriesUnits {
	one: string;
	other: string;
}

function unitLabel(value: number, units: SeriesUnits, formatters: DetailFormatters) {
	const unit = formatters.plural.select(value) === "one" ? units.one : units.other;
	return { unit, label: `${formatters.number.format(value)} ${unit}` };
}

function percentChange(current: number, previous: number | undefined): number | null {
	if (previous === undefined || previous <= 0) return null;
	return ((current - previous) / previous) * 100;
}

/**
 * The last four weeks, one point per week, for both 7D and 28D. The weekly API
 * data only has weekStart and gamesPlayed, so the tooltip shows the week range,
 * games and the change vs the previous week; confirmation and cancellation
 * rates are not available per week. dailyActivity is kept but not charted.
 */
export function buildGamesSeries(
	stats: Pick<FacilityReservationStatsView, "weeklyActivity">,
	messages: GamesMetricsMessages,
	formatters: DetailFormatters,
): GamesSeriesPointView[] {
	return buildWeeklySeries(
		stats.weeklyActivity.map((week) => ({ weekStart: week.weekStart, value: week.gamesPlayed })),
		{ one: messages.gamesUnitOne, other: messages.gamesUnitOther },
		messages,
		formatters,
	);
}

/** One chart point per week, shared by the Games (games played) and Users (activated players) charts. */
/** Weeks drawn by the Games and Users charts. */
const CHART_WEEKS = 4;

export function buildWeeklySeries(
	weeks: readonly { weekStart: string; value: number }[],
	units: SeriesUnits,
	messages: GamesMetricsMessages,
	formatters: DetailFormatters,
): GamesSeriesPointView[] {
	const points = weeks.map((point, index) => {
		const label = formatters.week.format(localDate(point.weekStart));
		const rangeLabel = `${label} \u2013 ${formatters.week.format(localDate(weekEndOf(point.weekStart)))}`;
		const games = unitLabel(point.value, units, formatters);
		const change = buildGamesMetricChange(
			percentChange(point.value, weeks[index - 1]?.value),
			"percent",
			true,
			messages,
			formatters,
		);
		const changeText = change
			? `${change.description} ${messages.gamesVersusPreviousWeek}`
			: messages.gamesNoPreviousWeek;
		return {
			key: point.weekStart,
			label,
			value: point.value,
			valueLabel: formatters.number.format(point.value),
			tooltipDetail: formatMessage(messages.gamesChartTooltip, { unit: games.unit, date: label }),
			rangeLabel,
			gamesLabel: games.label,
			change,
			summary: `${formatMessage(messages.gamesWeekOf, { range: rangeLabel })}: ${games.label}. ${changeText}`,
		};
	});
	// The chart shows the last four weeks; earlier weeks only feed the first tooltip comparison.
	return points.slice(-CHART_WEEKS);
}

export const GAMES_AXIS_ROWS = 3;

export function buildGamesAxis(largestValue: number): { max: number; ticks: number[] } {
	return buildRoundAxis(largestValue);
}

export function buildGamesCardView(
	reservations: ReservationPeriodView,
	stats: Pick<FacilityReservationStatsView, "weeklyActivity">,
	_period: StatsPeriod,
	messages: GamesMetricsMessages,
	detailMessages: Pick<DetailMessages, "confirmationRate">,
	periodMessages: Pick<StatsPeriodMessages, "span" | "comparison">,
	formatters: DetailFormatters,
): GamesCardView {
	const series = buildGamesSeries(stats, messages, formatters);
	const { max, ticks } = buildGamesAxis(Math.max(0, ...series.map((point) => point.value)));
	return {
		title: messages.gamesLastPeriod,
		hero: {
			value: formatters.number.format(reservations.played),
			comparison: formatMessage(messages.gamesVersusPreviousIn, {
				previous: formatters.number.format(reservations.playedPrevious),
				comparison: periodMessages.comparison,
			}),
			change: buildGamesMetricChange(
				reservations.playedChangePercent,
				"percent",
				true,
				messages,
				formatters,
			),
		},
		series,
		axisMax: max,
		ticks: ticks.map((value) => ({ value, label: formatters.number.format(Math.round(value)) })),
		rows: buildGamesMetricRows(reservations, messages, detailMessages, formatters),
	};
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

/**
 * Weeks spread edge to edge across the (10px-inset) plot: the first at 0%, the
 * last at 100%, a single week in the middle. Values on the 0-based scale.
 */
export function buildGamesChart(
	series: readonly Pick<GamesSeriesPointView, "value">[],
	axisMax: number,
): GamesChartView {
	const count = series.length;
	const points = series.map((point, index) => {
		const yPercent = round((point.value / (axisMax || 1)) * 100);
		return {
			xPercent: count > 1 ? round((index / (count - 1)) * 100) : 50,
			yPercent,
			topPercent: round(100 - yPercent),
		};
	});
	// Line vertices come from the exact numbers the dots are placed with.
	const coordinates = points.map((point) => `${point.xPercent},${point.topPercent}`);
	const first = points[0];
	const last = points.at(-1);
	return {
		points,
		linePoints: coordinates.join(" "),
		areaPoints:
			first && last && count > 1
				? [...coordinates, `${last.xPercent},100`, `${first.xPercent},100`].join(" ")
				: "",
	};
}

/** First label starts at its point, last ends at it, the rest center on it, so none overflow. */
export function xLabelAlignment(index: number, count: number): string {
	if (count > 1 && index === 0) return "-translate-x-[10px]";
	if (count > 1 && index === count - 1) return "-translate-x-[calc(100%-10px)]";
	return "-translate-x-1/2";
}

/**
 * Above the dot in the lower half of the plot, below it in the upper half, so the
 * ~70px tooltip stays inside the chart instead of covering the hero or clipping
 * at the top of the scrolling panel.
 */
export function tooltipPlacement(yPercent: number): string {
	return yPercent > 50 ? "top-full mt-3" : "bottom-full mb-3";
}

/** Same edge handling as the drill-down tooltips. */
export function tooltipAlignment(index: number, count: number): string {
	if (index === 0) return "left-0";
	if (index === count - 1) return "right-0";
	return "left-1/2 -translate-x-1/2";
}

export function useGamesMetricsListRules(view: GamesCardView) {
	const chart = useMemo(
		() => buildGamesChart(view.series, view.axisMax),
		[view.series, view.axisMax],
	);
	const gradientId = `games-area-${useId().replaceAll(":", "")}`;
	return { chart, gradientId };
}

const ROUND_AXIS_MIN_TOP = 10;
const ROUND_AXIS_STEPS = [1, 2, 4, 6, 8, 10] as const;

function buildRoundAxis(largestValue: number): { max: number; ticks: number[] } {
	const target = Math.max(largestValue, ROUND_AXIS_MIN_TOP);
	const magnitude = 10 ** Math.floor(Math.log10(target));
	const step = ROUND_AXIS_STEPS.find((candidate) => candidate * magnitude >= target) ?? 10;
	const max = step * magnitude;
	const intervals = GAMES_AXIS_ROWS - 1;
	const ticks = Array.from({ length: GAMES_AXIS_ROWS }, (_, index) => (max * index) / intervals);
	return { max, ticks };
}

export function buildPlayersAxis(largestValue: number): { max: number; ticks: number[] } {
	return buildRoundAxis(largestValue);
}

export type UsersCardMessages = GamesMetricsMessages &
	Pick<
		Messages["marketSummary"],
		| "usersActivePlayers"
		| "usersNewRegistrations"
		| "usersActiveUsers"
		| "usersUniqueUsers"
		| "usersUnitOne"
		| "usersUnitOther"
		| "usersLoadingMetric"
	>;

/**
 * App audience for the Users rows (market and all-markets scope only).
 * - `null`: not available at this level (a facility, unassigned facilities or a
 *   department filter), so the two audience rows are left out;
 * - `period: null` while loading shows placeholder rows; after an error they are left out.
 */
export interface UsersAudienceInput {
	period: AudiencePeriodView | null;
	isPending: boolean;
}

function pendingRow(
	key: GamesMetricRowView["key"],
	label: string,
	messages: UsersCardMessages,
): GamesMetricRowView {
	return {
		key,
		label,
		value: "",
		previousLabel: null,
		change: null,
		isPending: true,
		pendingLabel: formatMessage(messages.usersLoadingMetric, { metric: label }),
	};
}

/**
 * Users module (same header, chart, rows and box as Games), real data only, following
 * the newer staging definitions:
 * - Active players (hero + chart): activated players, i.e. people who played their
 *   first game in the period, vs the previous period; the chart is the last four
 *   weeks of activated players;
 * - New registrations: app accounts confirmed in the period (audience endpoint);
 * - Active users: people active in the app on at least one day of the period
 *   (audience endpoint);
 * - Unique users: distinct people who played a game at the scope's facilities
 *   (the old Unique players number).
 */
export function buildUsersCardView(
	players: PlayerPeriodView,
	stats: Pick<FacilityPlayerStatsView, "weeklyActivatedPlayers">,
	audience: UsersAudienceInput | null,
	messages: UsersCardMessages,
	periodMessages: Pick<StatsPeriodMessages, "comparison">,
	formatters: DetailFormatters,
): GamesCardView {
	const number = (value: number) => formatters.number.format(value);
	const countRow = (
		key: GamesMetricRowView["key"],
		label: string,
		value: number,
		previous: number,
		changePercent: number | null,
	): GamesMetricRowView => ({
		key,
		label,
		value: number(value),
		previousLabel: versus(number(previous), messages),
		change: buildGamesMetricChange(changePercent, "percent", true, messages, formatters),
	});
	const audienceRows = (): GamesMetricRowView[] => {
		if (!audience) return [];
		const users = audience.period;
		if (!users) {
			return audience.isPending
				? [
						pendingRow("registrations", messages.usersNewRegistrations, messages),
						pendingRow("activeUsers", messages.usersActiveUsers, messages),
					]
				: [];
		}
		return [
			countRow(
				"registrations",
				messages.usersNewRegistrations,
				users.registrations,
				users.registrationsPrevious,
				users.registrationsChangePercent,
			),
			countRow(
				"activeUsers",
				messages.usersActiveUsers,
				users.activeUsers,
				users.activeUsersPrevious,
				users.activeUsersChangePercent,
			),
		];
	};
	const series = buildWeeklySeries(
		stats.weeklyActivatedPlayers.map((week) => ({
			weekStart: week.weekStart,
			value: week.players,
		})),
		{ one: messages.usersUnitOne, other: messages.usersUnitOther },
		messages,
		formatters,
	);
	const { max, ticks } = buildPlayersAxis(Math.max(0, ...series.map((point) => point.value)));
	return {
		title: messages.usersActivePlayers,
		hero: {
			value: number(players.activatedPlayers),
			comparison: formatMessage(messages.gamesVersusPreviousIn, {
				previous: number(players.activatedPlayersPrevious),
				comparison: periodMessages.comparison,
			}),
			change: buildGamesMetricChange(
				players.activatedPlayersChangePercent,
				"percent",
				true,
				messages,
				formatters,
			),
		},
		series,
		axisMax: max,
		ticks: ticks.map((value) => ({ value, label: number(Math.round(value)) })),
		rows: [
			...audienceRows(),
			countRow(
				"uniqueUsers",
				messages.usersUniqueUsers,
				players.uniquePlayers,
				players.uniquePlayersPrevious,
				players.uniquePlayersChangePercent,
			),
		],
	};
}
