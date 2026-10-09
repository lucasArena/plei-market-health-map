import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";
import { SOFT_GLASS_CLASS } from "@/presentation/components/map/MapMetricSelect/MapMetricSelectComponent.styles";
import { MARKET_SUMMARY_PANEL_CLASS } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.styles";

export const DRILL_DOWN_COLORS = {
	magic: PLEIFUL_COLORS.moonlight[50],
	organizers: PLEIFUL_COLORS.sky[50],
	partnerships: PLEIFUL_COLORS.pitchGreen[40],
};
export const DRILL_DOWN_PANEL_CLASS = MARKET_SUMMARY_PANEL_CLASS;
export const DRILL_DOWN_EXPAND_BUTTON_CLASS = `${SOFT_GLASS_CLASS} flex size-7 shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`;
export const DRILL_DOWN_BAR_CLASS =
	"group relative min-h-[2px] w-full shrink-0 cursor-pointer bg-[linear-gradient(180deg,rgb(255_255_255/0.5)_0%,rgb(255_255_255/0.12)_45%,rgb(255_255_255/0)_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.7),inset_0_0_0_1px_rgb(255_255_255/0.28)] transition-[opacity,filter] hover:z-10 hover:opacity-90 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:brightness-110";
export const DRILL_DOWN_BAR_TOP_CLASS = "rounded-t-[5px]";
export function drillDownGlassColor(color: string): string {
	return `color-mix(in srgb, ${color} 85%, transparent)`;
}
export const DRILL_DOWN_EXPANDED_PANEL_CLASS = `${MARKET_SUMMARY_PANEL_CLASS.replace(
	"w-[min(28rem,calc(100vw-2*var(--map-frame)))]",
	"w-[min(72rem,calc(100vw-2*var(--map-frame)))]",
)} h-[calc(100dvh-2*var(--map-frame)-40px)] max-sm:h-[calc(100dvh-2*var(--map-frame)-80px)]`;
