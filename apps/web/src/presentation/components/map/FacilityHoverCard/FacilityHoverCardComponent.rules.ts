"use client";

import type { FacilityPointView, StatsPeriod } from "@market-health-map/core/application";
import { GAMES_WINDOW_DAYS, type GamesTrend } from "@market-health-map/core/domain";
import { formatMessage, type Messages } from "@market-health-map/core/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	CLUSTER_HOVER_CARD_CLASS,
	CLUSTER_HOVER_ENTER_CLASS,
	CLUSTER_HOVER_EXIT_CLASS,
	CLUSTER_HOVER_LIST_FADE_CLASS,
	FACILITY_HOVER_CARD_CLASS,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.styles";
import type {
	ClusterHoverCardPlacement,
	ClusterHoverCardPlacementInput,
	ClusterHoverSide,
	HoverTrendMessages,
} from "@/presentation/components/map/FacilityHoverCard/FacilityHoverCardComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useRevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion";
import type { RevealMotion } from "@/presentation/hooks/use-map/use-reveal-motion.types";
import {
	CLUSTER_HOVER_GAP,
	CLUSTER_OUTER_DIAMETER,
	CLUSTER_PREVIEW_LIMIT,
	FACILITY_GLASS_DIAMETER,
	HOVER_CARD_WIDTH,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.styles";
import type {
	ClusterHover,
	MapHover,
} from "@/presentation/screens/FacilitiesMapScreen/FacilitiesMapScreenComponent.types";

export const CLUSTER_HOVER_CHROME = {
	top: 20 + 32,
	right: CLUSTER_HOVER_GAP,
	bottom: 42 + 40 + 8 + 96,
	left: CLUSTER_HOVER_GAP,
} as const;

const CLUSTER_HOVER_TRANSFORMS: Record<ClusterHoverSide, string> = {
	top: "translate(-50%, -100%)",
	bottom: "translate(-50%, 0)",
	right: "translate(0, -50%)",
	left: "translate(-100%, -50%)",
} as const;

function clusterListContentHeight(rows: number) {
	const count = Math.max(rows, 0);
	const items = count * 32 + Math.max(count - 1, 0) * 2;
	return 6 + 6 + items;
}

export function clusterHoverCardHeight(facilityCount: number, hasMore: boolean, hasTrend = false) {
	const header = 8 + 28 + (hasTrend ? HOVER_TREND_LINE_HEIGHT : 0);
	if (facilityCount === 0) return header;
	const footer = { true: 24, false: 0 }[`${hasMore}`];
	const listHeight = Math.min(clusterListContentHeight(facilityCount), clusterHoverListMaxHeight());
	return header + 1 + listHeight + footer;
}

export function clusterHoverListMaxHeight(rows = CLUSTER_PREVIEW_LIMIT) {
	return clusterListContentHeight(rows) - 12;
}

export function clusterFacilitiesByName(facilities: readonly FacilityPointView[]) {
	return [...facilities].sort((left, right) =>
		left.name.localeCompare(right.name, "en", { sensitivity: "base" }),
	);
}

export const HOVER_TREND_LINE_HEIGHT = 16;
export const FACILITY_HOVER_TREND_HEIGHT = 32;

function changeTemplate(trend: GamesTrend, templates: Record<GamesTrend["level"], string>) {
	if (trend.change > 0) return templates.up;
	if (trend.change < 0) return templates.down;
	return templates.stable;
}

const hoverGamesBadgeFormatter = new Intl.NumberFormat("en", {
	notation: "compact",
	maximumFractionDigits: 1,
});

export function formatHoverGamesBadge(count: number) {
	return count >= 1000 ? hoverGamesBadgeFormatter.format(count) : String(count);
}

export function formatGamesCount(count: number, messages: HoverTrendMessages) {
	return formatMessage(count === 1 ? messages.gamesOne : messages.gamesOther, { count });
}

export function formatGamesChange(
	trend: GamesTrend,
	messages: HoverTrendMessages,
	days = GAMES_WINDOW_DAYS,
) {
	const template = changeTemplate(trend, {
		up: messages.changeUp,
		down: messages.changeDown,
		stable: messages.changeStable,
	});
	return formatMessage(template, { change: Math.abs(trend.change), days });
}

export function formatGamesTrend(
	trend: GamesTrend,
	messages: HoverTrendMessages,
	days = GAMES_WINDOW_DAYS,
) {
	const games = formatGamesCount(trend.current, messages);
	const template = changeTemplate(trend, {
		up: messages.gamesUp,
		down: messages.gamesDown,
		stable: messages.gamesStable,
	});
	return formatMessage(template, { games, change: Math.abs(trend.change), days });
}

export function trendWindowDays(period: StatsPeriod) {
	return { week: 7, month: GAMES_WINDOW_DAYS }[period];
}

export function clusterLabels(
	hover: ClusterHover,
	messages: Messages["map"],
	days = GAMES_WINDOW_DAYS,
) {
	if (hover.games !== undefined) {
		return {
			title: formatGamesCount(hover.games, messages.trend),
			trend: hover.trend ? formatGamesChange(hover.trend, messages.trend, days) : null,
			more: null,
		};
	}
	const remaining = hover.total - hover.facilities.length;
	return {
		title: formatMessage(messages.clusterCount, { count: hover.total }),
		trend: null,
		more:
			hover.facilities.length > 0 && remaining > 0
				? formatMessage(messages.moreFacilities, { count: remaining })
				: null,
	};
}

export function placeClusterHoverCard(
	input: ClusterHoverCardPlacementInput,
): ClusterHoverCardPlacement {
	const { card, chrome, cluster, clusterDiameter, gap, viewport } = input;
	const radius = clusterDiameter / 2;
	const bounds = {
		left: chrome.left,
		top: chrome.top,
		right: viewport.width - chrome.right,
		bottom: viewport.height - chrome.bottom,
	};
	const clusterTop = cluster.y - radius;
	const clusterBottom = cluster.y + radius;
	const clusterLeft = cluster.x - radius;
	const clusterRight = cluster.x + radius;
	const half = card.width / 2;
	const centered = cluster.x - half >= bounds.left && cluster.x + half <= bounds.right;
	const topEdge = clusterTop - gap - card.height;
	const bottomEdge = clusterBottom + gap + card.height;
	const sideTop = cluster.y - card.height / 2;
	const sideBottom = cluster.y + card.height / 2;
	const available = {
		top: centered && topEdge >= bounds.top,
		bottom: centered && bottomEdge <= bounds.bottom,
		right:
			clusterRight + gap + card.width <= bounds.right &&
			sideTop >= bounds.top &&
			sideBottom <= bounds.bottom,
		left:
			clusterLeft - gap - card.width >= bounds.left &&
			sideTop >= bounds.top &&
			sideBottom <= bounds.bottom,
	};
	const side =
		(["top", "bottom", "right", "left"] as const).find((candidate) => available[candidate]) ??
		"top";
	const origin = {
		top: { left: cluster.x, top: clusterTop - gap },
		bottom: { left: cluster.x, top: clusterBottom + gap },
		right: { left: clusterRight + gap, top: cluster.y },
		left: { left: clusterLeft - gap, top: cluster.y },
	}[side];
	return { side, ...origin, transform: CLUSTER_HOVER_TRANSFORMS[side] };
}

export function clusterListShowsBottomFade(
	scrollTop: number,
	clientHeight: number,
	scrollHeight: number,
) {
	if (scrollHeight <= clientHeight) return false;
	return scrollTop + clientHeight < scrollHeight - 1;
}

export function clusterListFadeClass(showsBottomFade: boolean) {
	return { true: CLUSTER_HOVER_LIST_FADE_CLASS, false: "" }[`${showsBottomFade}`];
}

export function clusterHoverMotionClass(motion: RevealMotion, retarget: boolean) {
	const settled = {
		hidden: "",
		enter: CLUSTER_HOVER_ENTER_CLASS,
		shown: "",
		exit: CLUSTER_HOVER_EXIT_CLASS,
	}[motion];
	return { true: "", false: settled }[`${retarget}`];
}

export function facilityHoverCardHeight(hasTrend = false) {
	const line = hasTrend ? FACILITY_HOVER_TREND_HEIGHT : 0;
	return 12 + 32 + line;
}

export function facilityTrendLine(
	hover: MapHover | null,
	messages: Messages["map"],
	days = GAMES_WINDOW_DAYS,
) {
	if (hover?.kind !== "facility") return null;
	if (hover.games === undefined || !hover.trend) return null;
	return formatGamesChange(hover.trend, messages.trend, days);
}

export function hoverCardSurfaceClass(kind: MapHover["kind"]) {
	return {
		cluster: CLUSTER_HOVER_CARD_CLASS,
		facility: FACILITY_HOVER_CARD_CLASS,
	}[kind];
}

function hoverTargetKey(hover: MapHover) {
	switch (hover.kind) {
		case "facility":
			return `facility:${hover.facility.id}`;
		case "cluster":
			return `cluster:${hover.clusterId}`;
		default: {
			const unknownHover: never = hover;
			return unknownHover;
		}
	}
}

function hoverMarkerDiameter(hover: MapHover) {
	switch (hover.kind) {
		case "facility":
			return FACILITY_GLASS_DIAMETER;
		case "cluster":
			return CLUSTER_OUTER_DIAMETER;
		default: {
			const unknownHover: never = hover;
			return unknownHover;
		}
	}
}

export function useFacilityHoverCardRules(
	hover: MapHover | null,
	messages: Messages["map"],
	onFacilitySelect?: (facility: FacilityPointView) => void,
) {
	const { period } = useMapScope();
	const days = trendWindowDays(period);
	const { finishReveal, isShown, motion } = useRevealMotion(hover !== null);
	const held = useRef<MapHover | null>(null);
	const previousKey = useRef<string | null>(null);
	const skipEnter = useRef(false);
	if (hover) held.current = hover;
	if (!hover) {
		skipEnter.current = false;
		if (motion === "hidden") previousKey.current = null;
	} else {
		const key = hoverTargetKey(hover);
		if (previousKey.current !== null && previousKey.current !== key) {
			skipEnter.current = true;
		}
		previousKey.current = key;
		if (motion === "shown") skipEnter.current = false;
	}
	const resting = { true: held.current, false: null }[`${isShown}`];
	const card = hover ?? resting;
	const clusterCard = card?.kind === "cluster" ? card : null;
	const facilityCard = card?.kind === "facility" ? card : null;
	const showFacilityGames = clusterCard?.games !== undefined || facilityCard?.games !== undefined;
	const facilities = clusterFacilitiesByName(clusterCard?.facilities ?? []);
	const listed = facilities.length;
	const hasMore =
		listed > 0 && clusterCard?.games === undefined && (clusterCard?.total ?? 0) > listed;
	const visibleRows = Math.min(listed, CLUSTER_PREVIEW_LIMIT);
	const listRef = useRef<HTMLUListElement>(null);
	const [showsBottomFade, setShowsBottomFade] = useState(false);
	const syncClusterListFade = useCallback(() => {
		const node = listRef.current;
		if (!node) return;
		setShowsBottomFade(
			clusterListShowsBottomFade(node.scrollTop, node.clientHeight, node.scrollHeight),
		);
	}, []);
	const facilityKey = facilities.map((facility) => facility.id).join("\0");
	useEffect(() => {
		if (facilityKey.length === 0) {
			setShowsBottomFade(false);
			return;
		}
		syncClusterListFade();
	}, [facilityKey, syncClusterListFade]);
	const selectListedFacility = useCallback(
		(facility: FacilityPointView) => {
			onFacilitySelect?.(facility);
		},
		[onFacilitySelect],
	);
	const placement = card
		? placeClusterHoverCard({
				cluster: { x: card.x, y: card.y },
				card: {
					width: HOVER_CARD_WIDTH,
					height: {
						cluster: clusterHoverCardHeight(visibleRows, hasMore, Boolean(card.trend)),
						facility: facilityHoverCardHeight(Boolean(card.trend)),
					}[card.kind],
				},
				viewport: card.viewport,
				chrome: CLUSTER_HOVER_CHROME,
				gap: CLUSTER_HOVER_GAP,
				clusterDiameter: hoverMarkerDiameter(card),
			})
		: null;
	return {
		card,
		clusterCard,
		facilities,
		facilityCard,
		facilityTrend: facilityTrendLine(facilityCard, messages, days),
		finishReveal,
		labels: clusterCard ? clusterLabels(clusterCard, messages, days) : null,
		listFadeClass: clusterListFadeClass(showsBottomFade),
		listMaxHeight: clusterHoverListMaxHeight(),
		listRef,
		motionClass: clusterHoverMotionClass(motion, skipEnter.current),
		placement,
		selectListedFacility,
		showFacilityGames,
		surfaceClass: card ? hoverCardSurfaceClass(card.kind) : "",
		syncClusterListFade,
	};
}
