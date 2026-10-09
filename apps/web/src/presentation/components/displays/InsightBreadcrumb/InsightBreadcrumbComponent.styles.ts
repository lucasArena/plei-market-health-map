/**
 * One line; font size and color come from the host (a panel description line).
 * Earlier crumbs shrink 100x faster (down to a 2.5rem stub) before the current
 * crumb truncates, so the current one keeps the most room.
 */
export const BREADCRUMB_LIST_CLASS = "flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden";

export const BREADCRUMB_EARLIER_ITEM_CLASS = "flex min-w-[2.5rem] shrink-[100] items-center gap-1";

export const BREADCRUMB_CURRENT_ITEM_CLASS = "flex min-w-0 shrink items-center gap-1";

/** #525866 is 7:1 on the panel glass. */
export const BREADCRUMB_LINK_CLASS =
	"min-w-0 max-w-[9rem] cursor-pointer truncate rounded-sm text-[#525866] hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60";

export const BREADCRUMB_TEXT_CLASS = "min-w-0 max-w-[9rem] truncate text-[#525866]";

/**
 * Plain text that inherits the host line's full font style and color (the
 * drill-down description). "Current" is carried by aria-current and by not
 * being a link, not by color.
 */
export const BREADCRUMB_CURRENT_CLASS = "min-w-0 truncate";

export const BREADCRUMB_SEPARATOR_CLASS = "shrink-0 text-[#525866]";
