import type { GamesTrendLevel } from "@market-health-map/core/domain";
import { useId } from "react";
import { GAMES_TREND_COLORS } from "@/application/constants/games-trend-colors";

export const SWATCH_RING = { inner: 6, outer: 8 };
const SWATCH_APEX = 12;
const SWATCH_TANGENT_Y = (SWATCH_RING.outer * SWATCH_RING.outer) / SWATCH_APEX;
const SWATCH_TANGENT_X = Math.sqrt(SWATCH_RING.outer ** 2 - SWATCH_TANGENT_Y ** 2);
export const SWATCH_TIP = `0,${SWATCH_APEX} ${SWATCH_TANGENT_X.toFixed(2)},${SWATCH_TANGENT_Y.toFixed(2)} 0,0 ${(-SWATCH_TANGENT_X).toFixed(2)},${SWATCH_TANGENT_Y.toFixed(2)}`;
const TIP_ROTATION = { up: 180, down: 0, stable: -90 } as const;

export function useTrendSwatchRules(level: GamesTrendLevel) {
	return {
		color: GAMES_TREND_COLORS[level],
		maskId: `trend-swatch-mask-${useId().replace(/:/g, "")}`,
		ringRadius: (SWATCH_RING.inner + SWATCH_RING.outer) / 2,
		rotation: TIP_ROTATION[level],
	};
}
