import type { GamesTrendDirection } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import type {
	FacilityHealthStatus,
	FacilityStatusStyle,
} from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent.types";

export const FACILITY_STATUS_STYLE: Record<FacilityHealthStatus, FacilityStatusStyle> = {
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
	onTrack: {
		dot: "bg-[#15803d] shadow-[0_0_4px_rgba(21,128,61,0.45)]",
		halo: "bg-[rgba(21,128,61,0.18)]",
		label: "text-[#166534]",
	},
};

export const FACILITY_CHANGE_PILL: Record<GamesTrendDirection, string> = {
	down: "bg-[#fee2e2] text-[#b91c1c]",
	up: "bg-[#dcfce7] text-[#166534]",
	flat: "bg-[rgba(118,118,128,0.12)] text-[#525866]",
};

export const FACILITY_CHANGE_ICON_PATH: Record<GamesTrendDirection, string> = {
	down: "m7 7 10 10M17 7v10H7",
	up: "M7 7h10v10M7 17 17 7",
	flat: "M5 12h14m-7-7 7 7-7 7",
};
