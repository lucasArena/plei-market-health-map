export type GamesTrendLevel = "up" | "stable" | "down";

export interface GamesTrend {
	level: GamesTrendLevel;
	current: number;
	previous: number;
	change: number;
	percentChange: number | null;
}
