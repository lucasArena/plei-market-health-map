import type { OverallGamesTrend } from "@core/application/dtos/market-summary-dto.types";

export const STABLE_CHANGE_PERCENT = 5;

export function toGamesTrend(played: number, playedPrevious: number): OverallGamesTrend {
	if (playedPrevious <= 0) return played > 0 ? "growing" : "stable";
	const changePercent = ((played - playedPrevious) / playedPrevious) * 100;
	if (changePercent <= -STABLE_CHANGE_PERCENT) return "declining";
	if (changePercent >= STABLE_CHANGE_PERCENT) return "growing";
	return "stable";
}
