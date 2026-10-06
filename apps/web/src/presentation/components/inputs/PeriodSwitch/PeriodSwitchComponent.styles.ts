export const PERIOD_SWITCH_CLASS =
	"map-glass pointer-events-auto relative m-0 inline-flex h-[32px] min-w-0 shrink-0 items-center rounded-full border p-[3px] text-[11px] font-semibold shadow-[var(--map-shadow)]";

export const PERIOD_THUMB_CLASS =
	"pointer-events-none absolute top-[3px] bottom-[3px] left-0 rounded-full bg-pleiful-pitch-green-80 transition-[transform,width,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

const PERIOD_OPTION_MOTION =
	"relative z-10 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none active:scale-[0.94] motion-reduce:active:scale-100";

export const PERIOD_OPTION_SELECTED_CLASS = `h-full cursor-pointer rounded-full px-2.5 text-white ${PERIOD_OPTION_MOTION}`;

export const PERIOD_OPTION_CLASS = `h-full cursor-pointer rounded-full px-2.5 text-map-icon hover:text-foreground ${PERIOD_OPTION_MOTION}`;
