"use client";

import {
	type MarketGameChangeView,
	type MarketHealthStatus,
	type MarketSummaryMarketRankView,
	toMarketHealthStatus,
} from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useMemo, useState } from "react";
import type {
	MarketChangeView,
	MarketsTableMessages,
	MarketsTableProps,
	MarketsTableRowView,
	MarketsTableSort,
	MarketsTableSortOption,
} from "@/presentation/components/map/MarketsTable/MarketsTableComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

const STATUS_ORDER: Record<MarketHealthStatus, number> = { attention: 0, watch: 1, "on-track": 2 };

const PENDING_STATUS_ORDER = 3;

const SORT_KEYS: readonly MarketsTableSort[] = ["status", "games", "change"];

export function formatChange(
	change: MarketGameChangeView,
	messages: MarketsTableMessages,
	percent: Intl.NumberFormat,
): MarketChangeView | null {
	if (change.changePercent === null) {
		return change.played > 0 ? { label: messages.noBaseline, direction: "up" } : null;
	}
	const rounded = Math.round(change.changePercent);
	const magnitude = percent.format(Math.abs(rounded));
	if (rounded < 0) return { label: `−${magnitude}%`, direction: "down" };
	if (rounded > 0) return { label: `+${magnitude}%`, direction: "up" };
	return { label: `${magnitude}%`, direction: "flat" };
}

export function buildMarketRows(
	markets: MarketSummaryMarketRankView[],
	changes: MarketGameChangeView[] | undefined,
	messages: MarketsTableMessages,
	locale: string,
): MarketsTableRowView[] {
	const number = new Intl.NumberFormat(locale);
	const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
	const changeById = new Map((changes ?? []).map((change) => [change.id, change]));
	const statusLabels: Record<MarketHealthStatus, string> = {
		attention: messages.attention,
		watch: messages.watch,
		"on-track": messages.onTrack,
	};
	return markets.map((market) => {
		const change = changeById.get(market.id);
		const status = change ? toMarketHealthStatus(change.played, change.playedPrevious) : null;
		return {
			id: market.id,
			name: market.name,
			status,
			statusLabel: status ? statusLabels[status] : null,
			activeLabel: formatMessage(messages.activeCount, {
				active: number.format(market.activeFacilityCount),
				total: number.format(market.facilityCount),
			}),
			games: market.games,
			gamesLabel: number.format(market.games),
			changePercent: change?.changePercent ?? null,
			change: change ? formatChange(change, messages, percent) : null,
			openLabel: formatMessage(messages.openMarket, { name: market.name }),
		};
	});
}

function byGamesThenName(a: MarketsTableRowView, b: MarketsTableRowView): number {
	return b.games - a.games || a.name.localeCompare(b.name);
}

function statusRank(row: MarketsTableRowView): number {
	return row.status ? STATUS_ORDER[row.status] : PENDING_STATUS_ORDER;
}

function changeRank(row: MarketsTableRowView): number {
	return row.changePercent ?? Number.POSITIVE_INFINITY;
}

const COMPARE: Record<
	MarketsTableSort,
	(a: MarketsTableRowView, b: MarketsTableRowView) => number
> = {
	status: (a, b) => statusRank(a) - statusRank(b) || byGamesThenName(a, b),
	games: byGamesThenName,
	change: (a, b) => changeRank(a) - changeRank(b) || byGamesThenName(a, b),
};

export function sortMarketRows(
	rows: MarketsTableRowView[],
	sort: MarketsTableSort,
): MarketsTableRowView[] {
	return [...rows].sort(COMPARE[sort]);
}

export function useMarketsTableRules({ markets, changes }: MarketsTableProps) {
	const { locale, messages } = useMessages();
	const { setMapNavigation } = useMapScope();
	const tableMessages = messages.marketsTable;
	const [sort, setSort] = useState<MarketsTableSort>("status");
	const rows = useMemo(
		() => sortMarketRows(buildMarketRows(markets, changes, tableMessages, locale), sort),
		[changes, locale, markets, sort, tableMessages],
	);
	const sortOptions: MarketsTableSortOption[] = SORT_KEYS.map((key) => ({
		key,
		label: {
			status: tableMessages.sortStatus,
			games: tableMessages.sortGames,
			change: tableMessages.sortChange,
		}[key],
	}));
	const note = {
		status: tableMessages.noteStatus,
		games: tableMessages.noteGames,
		change: tableMessages.noteChange,
	}[sort];

	const openMarket = useCallback(
		(row: MarketsTableRowView) => setMapNavigation({ kind: "market", id: row.id, name: row.name }),
		[setMapNavigation],
	);

	return { messages: tableMessages, note, openMarket, rows, setSort, sort, sortOptions };
}
