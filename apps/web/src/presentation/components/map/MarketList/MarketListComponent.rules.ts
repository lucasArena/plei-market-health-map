"use client";

import { MARKET_SUMMARY_RANK_LIMIT } from "@market-health-map/core/application";
import { useCallback, useId, useMemo, useState } from "react";
import {
	type MarketListRowView,
	MarketListSort,
	type MarketListSortOrder,
} from "@/presentation/components/map/MarketList/MarketListComponent.types";

/** Rows shown while collapsed; at or below this many the list shows everything and hides the CTA. */
/** Collapsed rows, the same 5 the summary used to cap at; "See all N" shows whenever N is larger. */
export const MARKET_COLLAPSED_LIMIT = MARKET_SUMMARY_RANK_LIMIT;

/**
 * Same ordering as the drill-down table: games descending by default, ties
 * broken by name (localeCompare in the UI locale); the name sort is A–Z / Z–A.
 */
export function sortMarketRows(
	rows: readonly MarketListRowView[],
	sort: MarketListSort,
	order: MarketListSortOrder,
	locale?: string,
): MarketListRowView[] {
	return [...rows].sort((left, right) => {
		if (sort === MarketListSort.change) {
			// Rows without a comparison (dash) always sit last; ties fall back to games, then name.
			if (left.changePercent === null || right.changePercent === null) {
				return (
					Number(left.changePercent === null) - Number(right.changePercent === null) ||
					right.games - left.games ||
					left.name.localeCompare(right.name, locale)
				);
			}
			const delta = left.changePercent - right.changePercent;
			return (
				(order === "asc" ? delta : -delta) ||
				right.games - left.games ||
				left.name.localeCompare(right.name, locale)
			);
		}
		if (sort === MarketListSort.name) {
			const byName = left.name.localeCompare(right.name, locale);
			return order === "asc" ? byName : -byName;
		}
		const delta = left.games - right.games;
		return (order === "asc" ? delta : -delta) || left.name.localeCompare(right.name, locale);
	});
}

/** `locale` drives the name tie-break, like the drill-down (which reads it from useMessages). */
export function useMarketListRules(rows: readonly MarketListRowView[], locale?: string) {
	const [sort, setSort] = useState<MarketListSort>(MarketListSort.games);
	const [order, setOrder] = useState<MarketListSortOrder>("desc");
	const [isExpanded, setIsExpanded] = useState(false);
	const listId = useId();

	/** Like the drill-down headers: games and vs prev start descending, the name column A–Z; a second click flips it. */
	const selectSort = useCallback(
		(next: MarketListSort) => {
			if (next === sort) {
				setOrder((current) => (current === "desc" ? "asc" : "desc"));
				return;
			}
			setSort(next);
			setOrder(next === MarketListSort.name ? "asc" : "desc");
		},
		[sort],
	);

	const toggleExpanded = useCallback(() => setIsExpanded((current) => !current), []);

	const sortedRows = useMemo(
		() => sortMarketRows(rows, sort, order, locale),
		[rows, sort, order, locale],
	);
	const isCollapsible = rows.length > MARKET_COLLAPSED_LIMIT;
	const visibleRows =
		isCollapsible && !isExpanded ? sortedRows.slice(0, MARKET_COLLAPSED_LIMIT) : sortedRows;

	return {
		isCollapsible,
		isExpanded,
		listId,
		order,
		selectSort,
		sort,
		toggleExpanded,
		visibleRows,
	};
}
