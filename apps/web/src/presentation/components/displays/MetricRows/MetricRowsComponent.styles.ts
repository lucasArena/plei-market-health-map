import type { MetricTone } from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";

export const METRIC_PILL: Record<MetricTone, string> = {
	bad: "bg-[#fee2e2] text-[#b91c1c]",
	good: "bg-[#dcfce7] text-[#166534]",
	neutral: "bg-[rgba(118,118,128,0.12)] text-[#525866]",
};
