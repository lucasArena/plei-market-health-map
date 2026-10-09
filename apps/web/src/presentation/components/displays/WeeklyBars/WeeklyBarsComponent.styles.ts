import type { GamesTrendDirection } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import type { WeeklyBarTone } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.types";

export const BAR_AREA_HEIGHT = 64;

export const WEEKLY_BAR_COLOR: Record<WeeklyBarTone, string> = {
	previous: "bg-[#d1d5db]",
	flat: "bg-[#98d1c2]",
	down1: "bg-[#fca5a5]",
	down2: "bg-[#f87171]",
	down3: "bg-[#dc2626]",
	up1: "bg-[#86efac]",
	up2: "bg-[#4ade80]",
	up3: "bg-[#16a34a]",
};

export const CAPTION_COLOR: Record<GamesTrendDirection, string> = {
	down: "text-[#b91c1c]",
	up: "text-[#15803d]",
	flat: "text-[#374151]",
};
