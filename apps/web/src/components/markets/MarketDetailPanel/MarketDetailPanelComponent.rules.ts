"use client";

import type { MarketDetailView } from "@market-health-map/application";
import type { MarketHealthStatus } from "@market-health-map/domain";
import { formatMessage, type Messages } from "@market-health-map/i18n";
import { useEffect, useMemo } from "react";
import { useMessages } from "@/components/i18n/MessagesProvider/MessagesProviderComponent";
import type {
	FacilityRow,
	MarketDetailPanelProps,
	MarketDetailStatus,
	MarketHeader,
	MarketIndicator,
} from "@/components/markets/MarketDetailPanel/MarketDetailPanelComponent.types";
import { HEALTH_STATUS_COLORS } from "@/components/markets/market-health-colors";
import { useMarketDetail } from "@/lib/api/use-market-detail";

const STATUS_MESSAGE_KEYS: Record<MarketHealthStatus, keyof Messages["map"]["statuses"]> = {
	healthy: "healthy",
	watch: "watch",
	"at-risk": "atRisk",
	inactive: "inactive",
};

export function buildHeader(detail: MarketDetailView, messages: Messages): MarketHeader {
	const { market } = detail;
	return {
		title: market.name,
		subtitle: `${market.state} · ${market.country}`,
		statusLabel: messages.map.statuses[STATUS_MESSAGE_KEYS[market.healthStatus]],
		statusColor: HEALTH_STATUS_COLORS[market.healthStatus],
		healthStatus: market.healthStatus,
	};
}

export function buildIndicators(
	detail: MarketDetailView,
	messages: Messages,
	numberFormat: Intl.NumberFormat,
): MarketIndicator[] {
	const { metrics } = detail.market;
	return [
		{
			key: "healthScore",
			label: messages.map.metrics.healthScore,
			value: numberFormat.format(metrics.healthScore),
			suffix: "/100",
		},
		{
			key: "activePlayers",
			label: messages.map.metrics.activePlayers,
			value: numberFormat.format(metrics.activePlayers),
		},
		{
			key: "gamesLastWeek",
			label: messages.map.metrics.gamesLastWeek,
			value: numberFormat.format(metrics.gamesLastWeek),
		},
		{
			key: "facilities",
			label: messages.map.metrics.facilities,
			value: numberFormat.format(metrics.facilities),
		},
	];
}

export function buildFacilityRows(
	detail: MarketDetailView,
	messages: Messages,
	numberFormat: Intl.NumberFormat,
): FacilityRow[] {
	const { marketDetail } = messages;
	return detail.facilities.map((facility) => ({
		...facility,
		playersLabel: `${numberFormat.format(facility.metrics.activePlayers)} ${marketDetail.players}`,
		gamesLabel: `${numberFormat.format(facility.metrics.gamesLastWeek)} ${marketDetail.games}`,
		utilizationLabel: `${facility.metrics.utilization}% ${marketDetail.utilization}`,
	}));
}

export function resolveDetailStatus(isPending: boolean, isError: boolean): MarketDetailStatus {
	const status = { [`${!isPending}`]: "ready", [`${isError}`]: "error" }.true;
	return (status ?? "loading") as MarketDetailStatus;
}

export function useMarketDetailPanelRules({ marketId, onClose }: MarketDetailPanelProps) {
	const { locale, messages } = useMessages();
	const query = useMarketDetail(marketId);
	const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
	const detail = query.data;
	const status = resolveDetailStatus(query.isPending, query.isError);

	const view = useMemo(() => {
		if (!detail) return null;
		return {
			header: buildHeader(detail, messages),
			indicators: buildIndicators(detail, messages, numberFormat),
			facilities: buildFacilityRows(detail, messages, numberFormat),
			facilitiesCountLabel: formatMessage(messages.marketDetail.facilitiesCount, {
				count: numberFormat.format(detail.facilities.length),
			}),
		};
	}, [detail, messages, numberFormat]);

	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [onClose]);

	return { messages: messages.marketDetail, onClose, status, view };
}
