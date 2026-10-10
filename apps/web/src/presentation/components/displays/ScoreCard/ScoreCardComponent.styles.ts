import type { MetricTone } from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";
import type { ScoreCardSize } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent.types";

export const SCORE_TONE_TEXT: Record<MetricTone, string> = {
	bad: "text-[#b91c1c] dark:text-red-300",
	good: "text-[#15803d] dark:text-green-300",
	neutral: "text-[#6b7280] dark:text-muted-foreground",
};

export const SCORE_VALUE_CLASS: Record<ScoreCardSize, string> = {
	primary: "text-[36px] leading-[44px]",
	secondary: "text-2xl leading-[29px]",
};

export const SCORE_CARD_CLASS =
	"flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white dark:bg-card p-3.5";
