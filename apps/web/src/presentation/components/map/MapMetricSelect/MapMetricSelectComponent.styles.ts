import { MAP_MENU_SURFACE_CLASS } from "@/presentation/components/map/MapSearch/MapSearchComponent.styles";

export const SOFT_GLASS_CLASS =
	"rounded-full border border-white/50 bg-white/25 text-foreground/60 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.03)] backdrop-blur-md transition-[background-color,color] duration-200 hover:bg-white/55 hover:text-foreground aria-expanded:bg-white/55 aria-expanded:text-foreground aria-pressed:bg-white/55 aria-pressed:text-foreground motion-reduce:transition-none dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.15)] dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/15 dark:aria-expanded:bg-white/15 dark:aria-pressed:bg-white/15";

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
	pill: `${SOFT_GLASS_CLASS} flex h-7 cursor-pointer items-center gap-1 px-2.5 text-[11px] font-medium disabled:cursor-default disabled:opacity-60 ${FOCUS_CLASS}`,
};

export const METRIC_SELECT_MENU_CLASS = {
	field: `${MAP_MENU_SURFACE_CLASS} z-50 min-w-48`,
	pill: MAP_MENU_SURFACE_CLASS.replace("map-glass", "glass-strong").concat(
		" z-50 min-w-32 rounded-2xl",
	),
};
