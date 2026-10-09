import type {
	StatusTone,
	StatusToneStyle,
} from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.types";

export const STATUS_TONE_STYLE: Record<StatusTone, StatusToneStyle> = {
	attention: {
		box: "border-[#fecaca] bg-[#fef2f2]",
		pill: "border-[#fca5a5] bg-[#fee2e2] text-[#b91c1c]",
		dot: "bg-[#dc2626]",
	},
	onTrack: {
		box: "border-[#e5e7eb] bg-[#f9fafb]",
		pill: "border-[#d1d5db] bg-[#f3f4f6] text-[#374151]",
		dot: "bg-[#6b7280]",
	},
	growing: {
		box: "border-[#bbf7d0] bg-[#f0fdf4]",
		pill: "border-[#86efac] bg-[#dcfce7] text-[#166534]",
		dot: "bg-[#16a34a]",
	},
};
