import { BAR_AREA_HEIGHT } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.styles";

export function barHeight(value: number, values: number[]): number {
	const high = Math.max(0, ...values);
	if (high <= 0 || value <= 0) return 2;
	return Math.max(2, Math.round((value / high) * BAR_AREA_HEIGHT));
}
