const HOVER_CARD_SURFACE_CLASS = [
	"w-full overflow-hidden",
	"rounded-[var(--map-radius)] border border-[rgba(255,255,255,0.78)]",
	"map-glass px-[5px] shadow-[var(--map-shadow)]",
].join(" ");

export const CLUSTER_HOVER_CARD_CLASS = `${HOVER_CARD_SURFACE_CLASS} pt-2`;

export const FACILITY_HOVER_CARD_CLASS = `${HOVER_CARD_SURFACE_CLASS} py-1.5`;

export const CLUSTER_HOVER_HEADING_CLASS =
	"px-2 pt-1 pb-2 text-[12px] font-medium leading-4 text-muted-foreground";

export const CLUSTER_HOVER_DIVIDER_CLASS = "h-px w-full bg-black/8";

export const CLUSTER_HOVER_LIST_CLASS =
	"cluster-hover-scroll flex flex-col gap-0.5 overflow-y-auto overscroll-contain py-1.5";

export const CLUSTER_HOVER_LIST_FADE_CLASS = "cluster-hover-list-fade";

export const CLUSTER_HOVER_ITEM_CLASS =
	"flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-left hover:bg-muted focus-visible:bg-muted";

export const CLUSTER_HOVER_NAME_CLASS =
	"min-w-0 flex-1 truncate text-[14px] leading-5 font-normal text-foreground";

export const CLUSTER_HOVER_FOOTER_CLASS =
	"px-2 py-1 text-[12px] font-medium leading-4 text-muted-foreground";

export const CLUSTER_HOVER_ENTER_CLASS = "cluster-hover-in";

export const CLUSTER_HOVER_EXIT_CLASS = "cluster-hover-out";
