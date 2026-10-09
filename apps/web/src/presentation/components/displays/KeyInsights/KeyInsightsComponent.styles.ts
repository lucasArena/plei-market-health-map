import type {
	InsightTone,
	InsightToneStyle,
} from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.types";
import { PANEL_SECTION_TITLE_CLASS } from "@/presentation/components/map/InsightPanel/InsightPanelComponent.styles";

export const INSIGHT_TONE_STYLE: Record<InsightTone, InsightToneStyle> = {
	neutral: {
		box: "bg-pleiful-moonlight-5",
		accent: "text-pleiful-moonlight-70",
		fade: "from-pleiful-moonlight-5",
		button: "border-pleiful-moonlight-10 text-pleiful-moonlight-70",
		skeleton: "bg-pleiful-moonlight-10",
	},
	attention: {
		box: "border border-[#fecaca] bg-[#fef2f2]",
		accent: "text-[#b91c1c]",
		fade: "from-[#fef2f2]",
		button: "border-[#d3d5d8] text-[#b91c1c]",
		skeleton: "bg-[#fecaca]/60",
	},
	stable: {
		box: "border border-[#e4e4e7] bg-[#f4f4f5]",
		accent: "text-[#52525b]",
		fade: "from-[#f4f4f5]",
		button: "border-[#d3d5d8] text-[#52525b]",
		skeleton: "bg-[#e4e4e7]",
	},
	growing: {
		box: "border border-[#bbf7d0] bg-[#f0fdf4]",
		accent: "text-[#15803d]",
		fade: "from-[#f0fdf4]",
		button: "border-[#d3d5d8] text-[#15803d]",
		skeleton: "bg-[#bbf7d0]/60",
	},
};

/** Insight panel (flat): the title uses the panel's section heading style. */
export const KEY_INSIGHTS_FLAT_TITLE_CLASS = `mb-2 flex items-center gap-1.5 ${PANEL_SECTION_TITLE_CLASS}`;
