export const HINT_CLASS = {
	up: "text-emerald-700",
	down: "text-red-600",
	flat: "text-muted-foreground",
} as const;

export type StatTilesVariant = "card" | "flat";

/**
 * Subtle insight-panel container shared by the Games, Active markets and Active
 * facilities modules: 3% dark tint, faint 1px border, 10px radius, 12px padding.
 */
export const INSIGHT_CONTAINER_CLASS =
	"rounded-[10px] border border-foreground/[0.06] bg-foreground/[0.03] p-[12px]";

/** Flat: no tile chrome, the drill-down's gap-2 between columns and its space-y-4 between rows. */
export const STAT_TILES_GRID_CLASS: Record<StatTilesVariant, string> = {
	card: "grid grid-cols-2 gap-2.5",
	flat: "grid grid-cols-2 gap-x-2 gap-y-4",
};

export const STAT_TILE_CLASS: Record<StatTilesVariant, string> = {
	card: "rounded-xl border bg-card p-3.5",
	flat: "min-w-0",
};

/**
 * One label style for every metric label in the insight panel (tiles and the
 * Games rows). Based on the "Unique players" tile label (11px, regular, no
 * tracking or case change), with the panel's #525866 secondary color (7:1).
 */
export const METRIC_LABEL_CLASS =
	"text-[11px] font-normal text-[#525866] dark:text-muted-foreground";

/** Compact metric line-height shared by the Games rows and the module headers: 11px label on 13px. */
export const METRIC_LABEL_LEADING_CLASS = "leading-[13px]";

/**
 * Compact metric value used by the Games and Users rows: 11px, the same size as
 * the grey "vs …" comparison next to it; dark semibold keeps it the lead. The
 * 18px line keeps the row height unchanged.
 */
export const METRIC_VALUE_CLASS =
	"text-[11px] leading-[18px] font-semibold text-[#1d1d1f] dark:text-foreground tabular-nums";

/** The drawer cards keep text-xs. */
export const STAT_TILE_LABEL_CLASS: Record<StatTilesVariant, string> = {
	card: "text-xs text-muted-foreground",
	flat: METRIC_LABEL_CLASS,
};

export const STAT_TILE_VALUE_CLASS: Record<StatTilesVariant, string> = {
	card: "mt-1 text-2xl font-semibold tabular-nums",
	flat: "mt-1 text-2xl font-semibold tabular-nums",
};

export const STAT_TILE_SKELETON_CLASS: Record<StatTilesVariant, string> = {
	card: "mt-2 h-7 w-16 animate-pulse rounded bg-muted",
	flat: "mt-2 h-7 w-16 animate-pulse rounded bg-muted",
};

/**
 * Shared 1px row divider for the Games, Users, Markets and Facilities module rows:
 * foreground/[0.08], drawn above every row but the first (none above the first
 * or below the last). It spans the box's content width; a list whose rows bleed
 * into the box padding (Markets/Facilities, -mx-3) sets --module-row-divider-inset
 * to pull it back to the same extent as the Games rows.
 */
export const MODULE_ROW_DIVIDER_CLASS =
	"relative not-first:before:absolute not-first:before:top-0 not-first:before:inset-x-[var(--module-row-divider-inset,0px)] not-first:before:h-px not-first:before:bg-foreground/[0.08] not-first:before:content-['']";

/**
 * Shared change badge for Games, Users, Markets and Facilities: 16px tall, 11px
 * semibold, 5px side padding, 2px gap, vivid translucent fill (red-500 / green-500)
 * with a stronger same-hue border and a light backdrop blur. Meaning is never
 * color alone: every badge has an arrow and a signed value. Contrast of the text on
 * the tinted fill over the module box (white panel / #f2f2f2 worst case):
 * worse #b91c1c on 16% #ef4444 5.2:1 / 4.7:1, better #15703a on 18% #22c55e
 * 5.3:1 / 4.8:1, flat #525866 6.5:1 / 5.8:1.
 */
export const CHANGE_BADGE_CLASS =
	"inline-flex h-[16px] items-center gap-[2px] rounded-full border px-[5px] text-[11px] leading-none font-semibold whitespace-nowrap tabular-nums backdrop-blur-[6px]";

export type ChangeBadgeTone = "worse" | "better" | "flat";

export const CHANGE_BADGE_TONE_CLASS: Record<ChangeBadgeTone, string> = {
	worse: "border-[#ef4444]/40 bg-[#ef4444]/[0.16] text-[#b91c1c] dark:text-red-300",
	better: "border-[#22c55e]/45 bg-[#22c55e]/[0.18] text-[#15703a] dark:text-green-300",
	flat: "border-foreground/10 bg-foreground/[0.05] text-[#525866] dark:text-muted-foreground",
};

/** 9px arrow inside the change badge. */
export const CHANGE_BADGE_ICON_CLASS = "size-[9px] shrink-0";
