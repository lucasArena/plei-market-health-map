import { PLEIFUL_COLORS } from "@/application/constants/brand-colors";

export const DRILL_DOWN_COLORS = {
	magic: PLEIFUL_COLORS.moonlight[50],
	organizers: PLEIFUL_COLORS.sky[50],
	partnerships: PLEIFUL_COLORS.pitchGreen[40],
};
export const DRILL_DOWN_PANEL_CLASS =
	"glass-panel pointer-events-auto fixed top-[calc(var(--map-frame)+40px)] right-[var(--map-frame)] z-30 flex max-h-[calc(100dvh-2*var(--map-frame)-40px)] w-[min(28rem,calc(100vw-2*var(--map-frame)))] flex-col overflow-hidden max-sm:top-[calc(var(--map-frame)+80px)] max-sm:max-h-[calc(100dvh-2*var(--map-frame)-80px)] rounded-[var(--map-radius)]";
