import type { MarketHealthStatus } from "@market-health-map/core/application";
import type {
	MarketChangeDirection,
	MarketStatusStyle,
} from "@/presentation/components/map/MarketsTable/MarketsTableComponent.types";

export const MARKET_STATUS_STYLE: Record<MarketHealthStatus | "pending", MarketStatusStyle> = {
	attention: {
		dot: "bg-[#dc2626] shadow-[0_0_4px_rgba(220,38,38,0.45)]",
		halo: "bg-[rgba(220,38,38,0.18)]",
		label: "text-[#b91c1c]",
	},
	watch: {
		dot: "bg-[#b45309] shadow-[0_0_4px_rgba(180,83,9,0.45)]",
		halo: "bg-[rgba(180,83,9,0.18)]",
		label: "text-[#92400e]",
	},
	"on-track": {
		dot: "bg-[#15803d] shadow-[0_0_4px_rgba(21,128,61,0.45)]",
		halo: "bg-[rgba(21,128,61,0.18)]",
		label: "text-[#166534]",
	},
	pending: { dot: "bg-[#9ca3af]", halo: "bg-[rgba(156,163,175,0.18)]", label: "text-[#525866]" },
};

export const MARKET_CHANGE_PILL: Record<MarketChangeDirection, string> = {
	down: "bg-[#fee2e2] text-[#b91c1c]",
	up: "bg-[#dcfce7] text-[#166534]",
	flat: "bg-[rgba(118,118,128,0.12)] text-[#525866]",
};

export const MARKET_CHANGE_ICON_PATH: Record<MarketChangeDirection, string> = {
	down: "m7 7 10 10M17 7v10H7",
	up: "M7 7h10v10M7 17 17 7",
	flat: "M5 12h14m-7-7 7 7-7 7",
};
