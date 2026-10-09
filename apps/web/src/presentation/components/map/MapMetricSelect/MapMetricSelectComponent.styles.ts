import { MAP_MENU_SURFACE_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

const FOCUS_CLASS =
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const METRIC_SELECT_ROOT_CLASS = {
	field: "relative min-w-0 space-y-1 border-0 p-0",
	pill: "relative min-w-0 border-0 p-0",
};

export const METRIC_SELECT_LABEL_CLASS = {
	field: "block text-muted-foreground",
	pill: "sr-only",
};

export const METRIC_SELECT_TRIGGER_CLASS = {
	field: `flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-foreground/[0.03] px-2 py-2 text-left text-xs hover:bg-foreground/[0.07] disabled:cursor-default disabled:opacity-60 ${FOCUS_CLASS}`,
	pill: `glass-strong flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold text-foreground transition-[background-color,transform] duration-200 hover:bg-white/70 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:cursor-default disabled:opacity-60 dark:hover:bg-white/10 ${FOCUS_CLASS}`,
};

export const METRIC_SELECT_MENU_CLASS = {
	field: `${MAP_MENU_SURFACE_CLASS} z-50 min-w-48`,
	pill: MAP_MENU_SURFACE_CLASS.replace("map-glass", "glass-strong").concat(
		" z-50 min-w-32 rounded-2xl",
	),
};
