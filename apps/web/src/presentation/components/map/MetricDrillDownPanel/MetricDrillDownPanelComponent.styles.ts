import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";
import { MARKET_SUMMARY_PANEL_CLASS } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.styles";

export const DRILL_DOWN_COLORS = {
	magic: PLEIFUL_COLORS.moonlight[50],
	organizers: PLEIFUL_COLORS.sky[50],
	partnerships: PLEIFUL_COLORS.pitchGreen[40],
};
export const DRILL_DOWN_PANEL_CLASS = MARKET_SUMMARY_PANEL_CLASS;
export const DRILL_DOWN_EXPANDED_PANEL_CLASS = `${MARKET_SUMMARY_PANEL_CLASS.replace(
	"w-[min(28rem,calc(100vw-2*var(--map-frame)))]",
	"w-[min(72rem,calc(100vw-2*var(--map-frame)))]",
)} h-[calc(100dvh-2*var(--map-frame)-40px)] max-sm:h-[calc(100dvh-2*var(--map-frame)-80px)]`;
