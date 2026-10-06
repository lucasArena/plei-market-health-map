import type { GamesTrendLevel } from "@market-health-map/core/domain";
import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";

export const GAMES_TREND_COLORS: Readonly<Record<GamesTrendLevel, string>> = {
	up: PLEIFUL_COLORS.success[30],
	down: PLEIFUL_COLORS.negative[40],
	stable: PLEIFUL_COLORS.neutral[50],
};
