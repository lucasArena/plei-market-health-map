import type { MarketHealthStatus } from "@core/application/dtos/market-summary-dto.types";

export const ATTENTION_CHANGE_PERCENT = -20;

export const WATCH_CHANGE_PERCENT = -10;

export function toMarketHealthStatus(played: number, playedPrevious: number): MarketHealthStatus {
	if (playedPrevious <= 0) return "on-track";
	const changePercent = ((played - playedPrevious) / playedPrevious) * 100;
	if (changePercent <= ATTENTION_CHANGE_PERCENT) return "attention";
	if (changePercent <= WATCH_CHANGE_PERCENT) return "watch";
	return "on-track";
}
