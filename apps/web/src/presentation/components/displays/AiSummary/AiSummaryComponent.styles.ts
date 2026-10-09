export const AI_SUMMARY_BOX_CLASS = "space-y-2 rounded-xl p-3.5";

/** Insight panel: no box, sits flat on the panel background. */
export const AI_SUMMARY_FLAT_CLASS = "space-y-2";

/** The boxed fade blends into the fill; the flat one masks the text so any background shows. */
export const AI_SUMMARY_FLAT_FADE_CLASS =
	"[mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]";

/** Flat Show more / Show less: brand green label (pitch-green-50, 5.6:1 on the white pill). */
export const AI_SUMMARY_FLAT_TOGGLE_CLASS =
	"border-pleiful-moonlight-10 text-pleiful-pitch-green-50 hover:text-pleiful-pitch-green-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pleiful-pitch-green-50";

export const AI_SUMMARY_HEIGHT_CLASS = { collapsed: "h-44", expanded: "" };
