import type {
	GamesTrend,
	MarketHealthStatus,
} from "@core/application/dtos/market-summary-dto.types";

export const ATTENTION_CHANGE_PERCENT = -20;

export const WATCH_CHANGE_PERCENT = -10;

export const STABLE_CHANGE_PERCENT = 5;

export function toMarketHealthStatus(played: number, playedPrevious: number): MarketHealthStatus {
	if (playedPrevious <= 0) return "on-track";
	const changePercent = ((played - playedPrevious) / playedPrevious) * 100;
	if (changePercent <= ATTENTION_CHANGE_PERCENT) return "attention";
	if (changePercent <= WATCH_CHANGE_PERCENT) return "watch";
	return "on-track";
}

export function toGamesTrend(played: number, playedPrevious: number): GamesTrend {
	if (playedPrevious <= 0) return played > 0 ? "growing" : "stable";
	const changePercent = ((played - playedPrevious) / playedPrevious) * 100;
	if (changePercent <= -STABLE_CHANGE_PERCENT) return "declining";
	if (changePercent >= STABLE_CHANGE_PERCENT) return "growing";
	return "stable";
}
