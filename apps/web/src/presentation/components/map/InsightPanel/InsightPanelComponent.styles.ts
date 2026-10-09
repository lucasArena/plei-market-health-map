export const MARKET_SUMMARY_PANEL_CLASS =
	"pointer-events-auto fixed top-[calc(var(--map-frame)+32px+8px)] right-[var(--map-frame)] z-30 flex max-h-[calc(100dvh-var(--map-frame)-32px-8px-var(--map-frame))] w-[min(28rem,calc(100vw-2*var(--map-frame)))] flex-col overflow-hidden max-sm:top-[calc(var(--map-frame)+80px)] max-sm:max-h-[calc(100dvh-2*var(--map-frame)-80px)] map-glass rounded-[var(--map-radius)] border shadow-[var(--map-shadow)]";

/**
 * Flat sections, matching MetricDrillDownPanel: no cards, the panel background shows through,
 * modules sit on the panel's px-5 and are split by its border-border rule with its space-y-4 rhythm.
 */
/**
 * 12px between sections. A divider (border-t + 12px padding) only between two
 * sections that are both unboxed; boxed sections (data-boxed: the Active tiles
 * and Games containers) are separated by spacing only.
 */
export const PANEL_SECTIONS_CLASS =
	"flex flex-col gap-[12px] [&>:not([data-boxed])+:not([data-boxed])]:border-t [&>:not([data-boxed])+:not([data-boxed])]:border-border [&>:not([data-boxed])+:not([data-boxed])]:pt-[12px]";

export const PANEL_SECTION_CLASS = "min-w-0";

/** MetricDrillDownPanel's section heading (text-base font-semibold). */
export const PANEL_SECTION_TITLE_CLASS = "text-base font-semibold text-foreground";

/**
 * Pinned header: it sits outside the scroll area (the panel is a flex column), so it keeps the
 * panel's own glass and blur, never scrolls, and nothing passes under it. The full-width
 * border-border rule under it matches the module dividers and stays visible at all times.
 */
export const PANEL_HEADER_CLASS = "shrink-0 border-b border-border px-5 pt-5 pb-4";

/** The only scroll container in the panel. */
export const PANEL_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto";

/** Body padding: the module divider rhythm (py-4) below the header rule, the panel's p-5 elsewhere. */
export const PANEL_CONTENT_CLASS = "px-5 pt-4 pb-5";

/** Top facilities rows: the whole row opens the Facility level, with the Markets list hover and a focus ring. */
/** The current crumb's h2; focus moves here when the panel changes level. */
export const SCOPE_HEADING_ID = "market-summary-heading";

/** The breadcrumb's current crumb; the heading is described by it. */
export const SCOPE_CURRENT_CRUMB_ID = "market-summary-current-crumb";

/** Shared panel header title (insight and drill-down panels). */
export const PANEL_TITLE_CLASS = "truncate text-base font-semibold";

/**
 * Shared panel header description line. The drill-down used text-xs
 * (10.5px, muted); raised to the 11px minimum and #525866 for contrast.
 */
export const PANEL_DESCRIPTION_CLASS = "text-[11px] leading-4 text-[#525866]";
