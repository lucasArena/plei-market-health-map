import type {
	StatusTone,
	StatusToneStyle,
} from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.types";

export const STATUS_TONE_STYLE: Record<StatusTone, StatusToneStyle> = {
	attention: {
		box: "border-[#fecaca] bg-[#fef2f2] dark:bg-red-950/60",
		pill: "border-[#fca5a5] bg-[#fee2e2] dark:bg-red-950/60 text-[#b91c1c] dark:text-red-300",
		dot: "bg-[#dc2626]",
	},
	onTrack: {
		box: "border-[#e5e7eb] bg-[#f9fafb] dark:bg-muted",
		pill: "border-[#d1d5db] bg-[#f3f4f6] dark:bg-muted text-[#374151] dark:text-foreground",
		dot: "bg-[#6b7280]",
	},
	growing: {
		box: "border-[#bbf7d0] bg-[#f0fdf4] dark:bg-green-950/60",
		pill: "border-[#86efac] bg-[#dcfce7] dark:bg-green-950/60 text-[#166534] dark:text-green-300",
		dot: "bg-[#16a34a]",
	},
};
