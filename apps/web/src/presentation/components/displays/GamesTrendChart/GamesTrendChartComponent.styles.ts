import type {
	GamesTrendColors,
	GamesTrendDirection,
	TooltipAlign,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";

export const CHART_WIDTH = 376;

export const CHART_HEIGHT = 96;

export const CHART_TOP = 22;

export const CHART_BOTTOM = 65.5;

export const CHART_BASELINE = 84.5;

export const GAMES_TREND_COLORS: Record<GamesTrendDirection, GamesTrendColors> = {
	down: {
		line: "#dc2626",
		area: "rgb(239 68 68)",
		halo: "bg-[rgba(239,68,68,0.16)]",
		dot: "bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.55)]",
		pill: "bg-[#fee2e2] text-[#b91c1c]",
		text: "text-[#b91c1c]",
	},
	up: {
		line: "#16a34a",
		area: "rgb(34 197 94)",
		halo: "bg-[rgba(34,197,94,0.16)]",
		dot: "bg-[#16a34a] shadow-[0_0_8px_rgba(22,163,74,0.55)]",
		pill: "bg-[#dcfce7] text-[#166534]",
		text: "text-[#166534]",
	},
	flat: {
		line: "#6b7280",
		area: "rgb(107 114 128)",
		halo: "bg-[rgba(107,114,128,0.16)]",
		dot: "bg-[#6b7280] shadow-[0_0_8px_rgba(107,114,128,0.45)]",
		pill: "bg-[rgba(118,118,128,0.12)] text-[#525866]",
		text: "text-[#525866]",
	},
};

export const TREND_ICON_PATH: Record<GamesTrendDirection, string> = {
	down: "M22 17 13.5 8.5l-5 5L2 7M16 17h6v-6",
	up: "M22 7 13.5 15.5l-5-5L2 17M16 7h6v6",
	flat: "M5 12h14",
};

export const TOOLTIP_ALIGN_CLASS: Record<TooltipAlign, string> = {
	start: "translate-x-0",
	center: "-translate-x-1/2",
	end: "-translate-x-full",
};
