"use client";

import type { FacilityGameChangeView } from "@market-health-map/core/application";
import { formatMessage } from "@market-health-map/core/i18n";
import { useCallback, useMemo, useState } from "react";
import type {
	FacilitiesTableEntry,
	FacilitiesTableMessages,
	FacilitiesTableProps,
	FacilitiesTableRowView,
	FacilityChangeView,
	FacilityHealthStatus,
} from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent.types";
import { useMapScope } from "@/presentation/components/providers/MapScopeProvider/MapScopeProviderComponent";
import { useMessages } from "@/presentation/components/providers/MessagesProvider/MessagesProviderComponent";

export const ATTENTION_CHANGE_PERCENT = -20;

export const WATCH_CHANGE_PERCENT = -10;

export const TOP_ROWS = 3;

export const BOTTOM_ROWS = 3;

export function facilityStatus(played: number, playedPrevious: number): FacilityHealthStatus {
	if (playedPrevious <= 0) return "onTrack";
	const changePercent = Math.round(((played - playedPrevious) / playedPrevious) * 100);
	if (changePercent <= ATTENTION_CHANGE_PERCENT) return "attention";
	if (changePercent <= WATCH_CHANGE_PERCENT) return "watch";
	return "onTrack";
}

export function formatFacilityChange(
	facility: FacilityGameChangeView,
	messages: FacilitiesTableMessages,
	percent: Intl.NumberFormat,
): FacilityChangeView | null {
	if (facility.changePercent === null) {
		return facility.played > 0 ? { label: messages.noBaseline, direction: "up" } : null;
	}
	const rounded = Math.round(facility.changePercent);
	const magnitude = percent.format(Math.abs(rounded));
	if (rounded < 0) return { label: `−${magnitude}%`, direction: "down" };
	if (rounded > 0) return { label: `+${magnitude}%`, direction: "up" };
	return { label: `${magnitude}%`, direction: "flat" };
}

export function buildFacilityRows(
	facilities: FacilityGameChangeView[],
	messages: FacilitiesTableMessages,
	locale: string,
): FacilitiesTableRowView[] {
	const number = new Intl.NumberFormat(locale);
	const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
	const labels: Record<FacilityHealthStatus, string> = {
		attention: messages.attention,
		watch: messages.watch,
		onTrack: messages.onTrack,
	};
	return facilities
		.filter((facility) => facility.played > 0 || facility.playedPrevious > 0)
		.map((facility) => {
			const status = facilityStatus(facility.played, facility.playedPrevious);
			return {
				id: facility.id,
				name: facility.name,
				status,
				statusLabel: labels[status],
				previousLabel: formatMessage(messages.previous, {
					previous: number.format(facility.playedPrevious),
				}),
				games: facility.played,
				gamesLabel: number.format(facility.played),
				change: facility.change,
				changeView: formatFacilityChange(facility, messages, percent),
				openLabel: formatMessage(messages.openFacility, { name: facility.name }),
			};
		});
}

export function sortFacilityRows(rows: FacilitiesTableRowView[]): FacilitiesTableRowView[] {
	return [...rows].sort(
		(a, b) => b.change - a.change || b.games - a.games || a.name.localeCompare(b.name),
	);
}

export function visibleEntries(
	rows: FacilitiesTableRowView[],
	isExpanded: boolean,
	messages: FacilitiesTableMessages,
): FacilitiesTableEntry[] {
	const asEntry = (row: FacilitiesTableRowView): FacilitiesTableEntry => ({
		kind: "row",
		key: row.id,
		row,
	});
	if (isExpanded || rows.length <= TOP_ROWS + BOTTOM_ROWS) return rows.map(asEntry);
	return [
		{ kind: "label", key: "top", label: messages.topGroup },
		...rows.slice(0, TOP_ROWS).map(asEntry),
		{
			kind: "gap",
			key: "gap",
			label: formatMessage(messages.hiddenCount, {
				count: String(rows.length - TOP_ROWS - BOTTOM_ROWS),
			}),
		},
		{ kind: "label", key: "bottom", label: messages.bottomGroup },
		...rows.slice(-BOTTOM_ROWS).map(asEntry),
	];
}

export function useFacilitiesTableRules({ facilities, marketName }: FacilitiesTableProps) {
	const { locale, messages } = useMessages();
	const { setMapNavigation } = useMapScope();
	const tableMessages = messages.facilitiesTable;
	const [isExpanded, setIsExpanded] = useState(false);
	const rows = useMemo(
		() => sortFacilityRows(buildFacilityRows(facilities, tableMessages, locale)),
		[facilities, locale, tableMessages],
	);
	const canExpand = rows.length > TOP_ROWS + BOTTOM_ROWS;
	const expandLabel = isExpanded
		? tableMessages.showFewer
		: formatMessage(tableMessages.showAll, { count: String(rows.length) });

	const toggleExpanded = useCallback(() => setIsExpanded((current) => !current), []);
	const openFacility = useCallback(
		(row: FacilitiesTableRowView) =>
			setMapNavigation({ kind: "facility", id: row.id, name: row.name, marketName }),
		[marketName, setMapNavigation],
	);

	return {
		canExpand,
		count: String(rows.length),
		entries: visibleEntries(rows, isExpanded, tableMessages),
		expandLabel,
		isExpanded,
		messages: tableMessages,
		openFacility,
		toggleExpanded,
	};
}
