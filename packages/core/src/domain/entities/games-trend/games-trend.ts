import type {
	GamesTrend,
	GamesTrendLevel,
} from "@core/domain/entities/games-trend/games-trend.types";

export const GAMES_WINDOW_DAYS = 28;

function count(value: number): number {
	return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

export function classifyGamesTrend(currentCount: number, previousCount: number): GamesTrendLevel {
	const current = count(currentCount);
	const previous = count(previousCount);
	if (current === previous) return "stable";
	return current > previous ? "up" : "down";
}

export function gamesTrend(currentCount: number, previousCount: number): GamesTrend {
	const current = count(currentCount);
	const previous = count(previousCount);
	return {
		level: classifyGamesTrend(current, previous),
		current,
		previous,
		change: current - previous,
		percentChange: previous === 0 ? null : Math.round(((current - previous) / previous) * 100),
	};
}
