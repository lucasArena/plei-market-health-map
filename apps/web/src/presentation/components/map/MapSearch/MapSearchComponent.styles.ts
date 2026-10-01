export const MAP_SEARCH_ROOT_CLASS = "pointer-events-auto relative z-40 w-full max-w-96 min-w-0";

export const MAP_MENU_SURFACE_CLASS =
	"map-glass absolute top-full mt-[4px] flex flex-col overflow-hidden rounded-[var(--map-radius)] border p-1 text-popover-foreground shadow-[var(--map-shadow)] outline-none";

export const MAP_SEARCH_RESULTS_CLASS = `${MAP_MENU_SURFACE_CLASS} inset-x-0 max-h-[min(28rem,calc(100vh-6rem))] overflow-y-auto`;

export const MAP_SEARCH_FIELD_CLASS =
	"map-glass flex h-[32px] items-center gap-[8px] rounded-full border border-border/70 px-[12px] shadow-[var(--map-shadow)]";

export const MAP_SEARCH_OPTION_HOVER_CLASS =
	"hover:bg-foreground/[0.07] focus:bg-foreground/[0.07] focus:outline-none";

export const MAP_MENU_GROUP_LABEL_CLASS =
	"text-[10px] font-semibold tracking-wider text-muted-foreground uppercase";

export const MAP_MENU_ROW_LABEL_CLASS = "text-sm font-medium";
