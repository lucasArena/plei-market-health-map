"use client";

import {
	type FacilityPlayerStatsView,
	type FacilityReservationDetailView,
	type FacilityReservationStatsView,
	type MarketGameChangeView,
	type MarketSummaryFacilityRankView,
	type MarketSummaryMarketRankView,
	type MarketSummaryScopeView,
	type MarketSummaryView,
	type StatsPeriod,
	toPlayerPeriodView,
	toReservationPeriodView,
} from "@market-health-map/core/application";
import type { GameDepartment } from "@market-health-map/core/domain";
import { formatMessage, type StatsPeriodMessages } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ActivitySummarySubject } from "@/infrastructure/ai/prompts/activity-summary-prompt.types";
import { aiSummaryContextFor } from "@/presentation/components/displays/AiSummary/AiSummaryComponent.rules";
import {
	buildGamesCardView,
	buildUsersCardView,
	type UsersAudienceInput,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.rules";
import type { GamesHeroView } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import {
	activityPeriodFor,
	buildPopularTimes,
	buildProgressiveTiles,
	buildSummary,
	createDetailFormatters,
	directionOf,
	formatGames,
	resolveDetailStatus,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import type {
	DetailFormatters,
	DetailMessages,
} from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import { SCOPE_HEADING_ID } from "@/presentation/components/map/InsightPanel/InsightPanelComponent.styles";
import type {
	FacilityLevelView,
	InsightPanelProps,
	MarketRankRowView,
	MarketSummaryHeading,
	MarketSummaryMessages,
	MarketSummaryViewModel,
	ScopeCrumbView,
	ScopeLevel,
} from "@/presentation/components/map/InsightPanel/InsightPanelComponent.types";
import {
	type MarketListRowView,
	MarketTrendStatus,
} from "@/presentation/components/map/MarketList/MarketListComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import type {
	MapNavigation,
	MapScope,
} from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent.types";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";
import { useFacilityPlayerStats } from "@/presentation/hooks/use-facility/use-facility-player-stats";
import { useFacilityReservationStats } from "@/presentation/hooks/use-facility/use-facility-reservation-stats";
import { useMarketAudience } from "@/presentation/hooks/use-market/use-market-audience";
import { useMarketGameInsights } from "@/presentation/hooks/use-market/use-market-game-insights";
import { useMarketPlayerStats } from "@/presentation/hooks/use-market/use-market-player-stats";
import { useMarketSummary } from "@/presentation/hooks/use-market/use-market-summary";
import { useMarketSummaryFilters } from "@/presentation/hooks/use-market/use-market-summary-filters";

function countLabel(count: number, one: string, other: string, formatters: DetailFormatters) {
	const template = formatters.plural.select(count) === "one" ? one : other;
	return formatMessage(template, { count: formatters.number.format(count) });
}

/**
 * Games-style header for an active count (markets or facilities), real data only:
 * the scope's active count (at least one game in the period) as the big number
 * and "{n} inactive" (total − active) below it. No previous-period comparison.
 */
function buildActiveCountHero(
	active: number,
	total: number,
	inactive: { one: string; other: string },
	formatters: DetailFormatters,
): GamesHeroView {
	return {
		value: formatters.number.format(active),
		change: null,
		comparison: countLabel(Math.max(0, total - active), inactive.one, inactive.other, formatters),
	};
}

/** Active markets: scope.activeMarketCount, with the inactive markets below. */
export function buildMarketsHero(
	scope: MarketSummaryScopeView,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): GamesHeroView {
	return buildActiveCountHero(
		scope.activeMarketCount,
		scope.marketCount,
		{ one: messages.marketsInactiveOne, other: messages.marketsInactiveOther },
		formatters,
	);
}

/** Active facilities: scope.activeFacilityCount, with the inactive facilities below. */
export function buildFacilitiesHero(
	scope: MarketSummaryScopeView,
	messages: MarketSummaryMessages,
	formatters: DetailFormatters,
): GamesHeroView {
	return buildActiveCountHero(
		scope.activeFacilityCount,
		scope.facilityCount,
		{ one: messages.facilitiesInactiveOne, other: messages.facilitiesInactiveOther },
		formatters,
	);
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

const MINUS_SIGN = "\u2212";
const EM_DASH = "\u2014";

export function marketTrendStatusOf(change: MarketGameChangeView): MarketTrendStatus {
	if (change.playedPrevious === 0 || change.changePercent === null) return MarketTrendStatus.new;
	const rounded = Math.round(change.changePercent);
	if (rounded < 0) return MarketTrendStatus.declining;
	if (rounded > 0) return MarketTrendStatus.growing;
	return MarketTrendStatus.steady;
}

function marketStatusLabel(status: MarketTrendStatus, messages: MarketSummaryMessages): string {
	return {
		declining: messages.statusDeclining,
		steady: messages.statusSteady,
		new: messages.statusNew,
		growing: messages.statusGrowing,
	}[status];
}

export function formatChangePercent(percent: number, formatters: DetailFormatters): string {
	const rounded = Math.round(percent);
	const magnitude = formatters.number.format(Math.abs(rounded));
	if (rounded > 0) return `+${magnitude}%`;
	if (rounded < 0) return `${MINUS_SIGN}${magnitude}%`;
	return `${magnitude}%`;
}

interface MarketRowInput {
	id: string;
	name: string;
	games: number;
	activeFacilityCount: number;
	facilityCount: number;
	change: MarketGameChangeView | undefined;
}

function toMarketListRow(
	market: MarketRowInput,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): MarketListRowView {
	const { change } = market;
	const status = change ? marketTrendStatusOf(change) : null;
	const statusLabel = status ? marketStatusLabel(status, messages) : null;
	const changePercent = change?.changePercent ?? null;
	const changeLabel =
		changePercent === null ? EM_DASH : formatChangePercent(changePercent, formatters);
	const changeDirection = changePercent === null ? null : directionOf(Math.round(changePercent));
	const detail = formatMessage(messages.marketActive, {
		active: formatters.number.format(market.activeFacilityCount),
		total: formatters.number.format(market.facilityCount),
	});
	let changeDescription: string | null = null;
	if (change) {
		changeDescription =
			changePercent === null
				? messages.changeUnavailable
				: formatMessage(messages.changeVersus, {
						change: changeLabel,
						comparison: periodMessages.comparison,
					});
	}
	return {
		key: market.id,
		id: market.id,
		name: market.name,
		status,
		statusLabel,
		detail,
		games: market.games,
		gamesLabel: formatters.number.format(market.games),
		changePercent,
		changeDirection,
		changeLabel,
		ariaLabel: [
			market.name,
			detail,
			formatGames(market.games, detailMessages, formatters),
			changeDescription,
		]
			.filter(Boolean)
			.join(", "),
	};
}

/**
 * Rows for the glass Markets list. Uses the per-market game comparison when it has loaded
 * (every market with games in either period), otherwise falls back to the top markets ranking
 * without status or change.
 */
export function buildMarketRows(
	markets: MarketSummaryMarketRankView[],
	changes: MarketGameChangeView[] | undefined,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
): MarketListRowView[] {
	const inputs: MarketRowInput[] = changes?.length
		? changes
				.filter((row) => row.played > 0 || row.playedPrevious > 0)
				.map((row) => ({
					id: row.id,
					name: row.name,
					games: row.played,
					activeFacilityCount: row.facilities.filter((facility) => facility.played > 0).length,
					facilityCount: row.facilities.length,
					change: row,
				}))
		: markets.map((market) => ({ ...market, change: undefined }));
	return inputs.map((market) =>
		toMarketListRow(market, messages, detailMessages, periodMessages, formatters),
	);
}

/**
 * Top facilities as Markets-style rows. The "vs prev" pill comes from the same
 * per-period game comparison as the Markets column (gameChanges, whose markets
 * carry each facility's played / playedPrevious / changePercent); until it
 * loads, or for a facility without previous games, the pill is a dash.
 */
export function marketFacilities(changes: MarketGameChangeView[]): MarketSummaryFacilityRankView[] {
	return changes
		.flatMap((market) =>
			market.facilities
				.filter((facility) => facility.played > 0 || facility.playedPrevious > 0)
				.map((facility) => ({
					id: facility.id,
					name: facility.name,
					marketName: market.name,
					games: facility.played,
				})),
		)
		.sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
}

export function buildFacilityRows(
	facilities: MarketSummaryFacilityRankView[],
	changes: MarketGameChangeView[] | undefined,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
	isSingleMarket = false,
): MarketRankRowView[] {
	const changeById = new Map(
		(changes ?? []).flatMap((market) => market.facilities.map((row) => [row.id, row] as const)),
	);
	const listed = isSingleMarket && changes?.length ? marketFacilities(changes) : facilities;
	return listed.map((facility, index) => {
		const value = formatGames(facility.games, detailMessages, formatters);
		const change = changeById.get(facility.id);
		const changePercent = change?.changePercent ?? null;
		const changeLabel =
			changePercent === null ? EM_DASH : formatChangePercent(changePercent, formatters);
		let changeDescription: string | null = null;
		if (change) {
			changeDescription =
				changePercent === null
					? messages.changeUnavailable
					: formatMessage(messages.changeVersus, {
							change: changeLabel,
							comparison: periodMessages.comparison,
						});
		}
		return {
			key: facility.id,
			id: facility.id,
			marketName: facility.marketName,
			rank: index + 1,
			name: facility.name,
			detail: facility.marketName,
			value,
			games: facility.games,
			gamesLabel: formatters.number.format(facility.games),
			status: null,
			statusLabel: null,
			changePercent,
			changeDirection: changePercent === null ? null : directionOf(Math.round(changePercent)),
			changeLabel,
			// No rank prefix: the table can be re-sorted by name.
			ariaLabel: [`${facility.name}, ${facility.marketName}: ${value}`, changeDescription]
				.filter(Boolean)
				.join(", "),
		};
	});
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

/** Tiles already shown in the Games module (played, confirmation) or the Users module (activated = Active players, players = Unique users). */
const MODULE_METRIC_TILE_KEYS: ReadonlySet<string> = new Set([
	"played",
	"confirmation",
	"players",
	"activated",
]);

function activityViews(
	stats: FacilityReservationStatsView,
	playerStats: FacilityPlayerStatsView | undefined,
	isPlayerPending: boolean,
	audience: UsersAudienceInput | null,
	period: StatsPeriod,
	messages: MarketSummaryMessages,
	detailMessages: DetailMessages,
	periodMessages: StatsPeriodMessages,
	formatters: DetailFormatters,
) {
	const reservations = toReservationPeriodView(stats, period);
	return {
		games: buildGamesCardView(
			reservations,
			stats,
			period,
			messages,
			detailMessages,
			periodMessages,
			formatters,
		),
		tiles: buildProgressiveTiles(
			reservations,
			playerStats ? toPlayerPeriodView(playerStats, period) : undefined,
			isPlayerPending,
			detailMessages,
			formatters,
		).filter((tile) => !MODULE_METRIC_TILE_KEYS.has(tile.key)),
		users: playerStats
			? buildUsersCardView(
					toPlayerPeriodView(playerStats, period),
					playerStats,
					audience,
					messages,
					periodMessages,
					formatters,
				)
			: null,
		isUsersPending: !playerStats && isPlayerPending,
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
	audience: UsersAudienceInput | null = null,
): MarketSummaryViewModel {
	const rankings = summary.periods[period];
	return {
		...activityViews(
			summary.stats,
			playerStats,
			isPlayerPending,
			audience,
			period,
			messages,
			detailMessages,
			periodMessages,
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
		marketsHero: isSingleMarket ? null : buildMarketsHero(rankings.scope, messages, formatters),
		topMarkets: isSingleMarket
			? null
			: buildMarketRows(
					rankings.topMarkets,
					summary.gameChanges,
					messages,
					detailMessages,
					periodMessages,
					formatters,
				),
		facilitiesHero: buildFacilitiesHero(rankings.scope, messages, formatters),
		topFacilities: buildFacilityRows(
			rankings.topFacilities,
			summary.gameChanges,
			messages,
			detailMessages,
			periodMessages,
			formatters,
			isSingleMarket,
		),
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
	messages: MarketSummaryMessages,
): MarketSummaryViewModel {
	return {
		// No audience rows here: registrations and app activity are counted per
		// region, and players have no home facility to attribute them to.
		...activityViews(
			stats,
			playerStats,
			isPlayerPending,
			null,
			period,
			messages,
			detailMessages,
			periodMessages,
			formatters,
		),
		summary: playerStats
			? buildSummary(
					activityPeriodFor(stats, playerStats, period),
					detailMessages,
					periodMessages,
					formatters,
				)
			: null,
		marketsHero: null,
		facilitiesHero: null,
		topMarkets: null,
		topFacilities: null,
	};
}

export function buildFacilityLevelView(
	detail: FacilityReservationDetailView,
	detailMessages: DetailMessages,
	formatters: DetailFormatters,
): FacilityLevelView {
	return {
		name: detail.facility.name,
		address: detail.facility.address,
		avatarUrl: detail.facility.avatarUrl,
		popularTimes: buildPopularTimes(detail.stats, detailMessages, formatters),
		dayLabels: [...detailMessages.dayLabels],
		timePeriodLabels: [...detailMessages.timePeriodLabels],
	};
}

function crumb(
	key: ScopeLevel,
	label: string,
	level: string | null,
	target: MapNavigation | null,
	messages: MarketSummaryMessages,
): ScopeCrumbView {
	return {
		key,
		label,
		title: level ? formatMessage(messages.breadcrumbCrumbTitle, { level, name: label }) : label,
		target,
	};
}

/** All markets / Market / Facility, only the levels that apply; the last crumb is the current one. */
export function buildScopeCrumbs(
	scope: MapScope,
	messages: MarketSummaryMessages,
): ScopeCrumbView[] {
	const isAll = scope.kind === "all";
	const crumbs = [
		crumb("all", messages.allMarkets, null, isAll ? null : { kind: "all" }, messages),
	];
	if (scope.kind === "market") {
		crumbs.push(crumb("market", scope.name, messages.breadcrumbLevelMarket, null, messages));
	}
	if (scope.kind === "facility") {
		const marketTarget: MapNavigation | null = scope.marketId
			? { kind: "market", id: scope.marketId, name: scope.marketName }
			: null;
		crumbs.push(
			crumb("market", scope.marketName, messages.breadcrumbLevelMarket, marketTarget, messages),
			crumb("facility", scope.name, messages.breadcrumbLevelFacility, null, messages),
		);
	}
	return crumbs;
}

export function buildScopeHeading(
	scope: MapScope,
	messages: MarketSummaryMessages,
	periodMessages: StatsPeriodMessages,
): MarketSummaryHeading {
	const span = periodMessages.span;
	const crumbs = buildScopeCrumbs(scope, messages);
	if (scope.kind === "facility") {
		return {
			title: scope.name,
			subtitle: formatMessage(messages.facilitySummarySubtitle, { span }),
			crumbs,
		};
	}
	if (scope.kind === "market") {
		return {
			title: scope.name,
			subtitle: formatMessage(messages.marketSubtitle, { span }),
			crumbs,
		};
	}
	return {
		title: messages.allMarkets,
		subtitle: formatMessage(messages.subtitle, { span }),
		crumbs,
	};
}

export function buildMarketAiSubject(
	scope: MapScope,
	heading: Pick<MarketSummaryHeading, "title">,
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

const REGION_ID_PATTERN = /^\d+$/;

/**
 * New registrations and Active users come from app-wide tables keyed by region, so
 * they exist for all markets or one region only: not for a facility, not for the
 * "unassigned" bucket (no region id; the server would answer zeros), and not under a
 * department filter (app sign-ups and sessions have no game department).
 */
export function isAudienceScope(
	isMarketScope: boolean,
	marketId: string | null,
	departments: readonly unknown[],
): boolean {
	if (!isMarketScope || departments.length > 0) return false;
	return marketId === null || REGION_ID_PATTERN.test(marketId);
}

export function useInsightPanelRules({ isClosing, onClose, onClosed }: InsightPanelProps) {
	const { locale, messages } = useMessages();
	const { period, scope, setMapNavigation } = useMapScope();
	const periodMessages = messages.statsPeriods[period];
	const facilityId = scope.kind === "facility" ? scope.id : null;
	const marketId = scope.kind === "market" ? scope.id : null;
	const isMarketScope = facilityId === null;
	const { departments } = useMarketSummaryFilters();
	const summaryQuery = useMarketSummary(marketId, isMarketScope, departments);
	const insightsQuery = useMarketGameInsights(
		marketId,
		period,
		isMarketScope && !!summaryQuery.data,
		departments,
	);
	const marketPlayerQuery = useMarketPlayerStats(marketId, isMarketScope, departments);
	const isAudienceAvailable = isAudienceScope(isMarketScope, marketId, departments);
	const audienceQuery = useMarketAudience(marketId, isAudienceAvailable);
	const audienceData = audienceQuery.data;
	const isAudiencePending = audienceQuery.isPending;
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
						messages.marketSummary,
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
					isAudienceAvailable
						? { period: audienceData?.periods[period] ?? null, isPending: isAudiencePending }
						: null,
				)
			: null;
	}, [
		audienceData,
		isAudienceAvailable,
		isAudiencePending,
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
	const facilityView = useMemo(
		() =>
			!isMarketScope && facilityReport
				? buildFacilityLevelView(facilityReport, messages.facilityDetail, formatters)
				: null,
		[facilityReport, formatters, isMarketScope, messages.facilityDetail],
	);
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

	// Move keyboard and screen-reader focus to the new heading when the level changes
	// (breadcrumb, rows, map or search), but not when the panel first opens.
	const levelKey = scope.kind === "all" ? "all" : `${scope.kind}:${scope.id}`;
	const previousLevelRef = useRef(levelKey);
	const bodyRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (previousLevelRef.current === levelKey) return;
		previousLevelRef.current = levelKey;
		if (bodyRef.current) bodyRef.current.scrollTop = 0;
		document.getElementById(SCOPE_HEADING_ID)?.focus({ preventScroll: true });
	}, [levelKey]);

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

	const selectMarket = useCallback(
		(row: MarketListRowView) => setMapNavigation({ kind: "market", id: row.id, name: row.name }),
		[setMapNavigation],
	);

	const selectFacility = useCallback(
		(row: MarketRankRowView) =>
			setMapNavigation({
				kind: "facility",
				id: row.id,
				name: row.name,
				marketName: row.marketName,
			}),
		[setMapNavigation],
	);

	/** Same path as the map, search and market rows, so the map selection follows the crumb. */
	const selectCrumb = useCallback(
		(target: MapNavigation) => setMapNavigation(target),
		[setMapNavigation],
	);

	const rankingsEmptyLabel = formatMessage(messages.marketSummary.noRankings, {
		within: periodMessages.within,
	});
	const seeAllMarketsLabel = formatMessage(messages.marketSummary.seeAllMarkets, {
		count: formatters.number.format(insightsView?.topMarkets?.length ?? 0),
	});
	const seeAllFacilitiesLabel = formatMessage(messages.marketSummary.seeAllFacilities, {
		count: formatters.number.format(insightsView?.topFacilities?.length ?? 0),
	});

	return {
		locale,
		aiContext,
		rankingsEmptyLabel,
		detailMessages: messages.facilityDetail,
		facilityView,
		handleAnimationEnd,
		bodyRef,
		heading,
		level: scope.kind,
		isClosing,
		isSummaryPending:
			status === "ready" && ((isMarketScope && insightsQuery.isPending) || playerQuery.isPending),
		isInsightsFailed: isMarketScope && insightsQuery.isError,
		messages: messages.marketSummary,
		onClose,
		seeAllMarketsLabel,
		seeAllFacilitiesLabel,
		selectCrumb,
		selectFacility,
		selectMarket,
		status,
		view: insightsView,
	};
}
