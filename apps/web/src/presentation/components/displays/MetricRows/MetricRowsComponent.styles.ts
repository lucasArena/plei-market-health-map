import type { MetricTone } from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";

export const METRIC_PILL: Record<MetricTone, string> = {
	bad: "bg-[#fee2e2] dark:bg-red-950/60 text-[#b91c1c] dark:text-red-300",
	good: "bg-[#dcfce7] dark:bg-green-950/60 text-[#166534] dark:text-green-300",
	neutral: "bg-[rgba(118,118,128,0.12)] text-[#525866] dark:text-muted-foreground",
};
