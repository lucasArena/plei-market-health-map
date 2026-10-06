export type GamesTrendLevel = "up" | "stable" | "down";

export interface GamesTrend {
	level: GamesTrendLevel;
	current: number;
	previous: number;
	/** current minus previous. */
	change: number;
	/** Rounded percent change against the previous window, or null when the previous window was 0. */
	percentChange: number | null;
}
