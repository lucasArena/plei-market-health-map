// The search is portaled into the header row (see HeaderSlotProvider), so the
// row's flex gap keeps it left of the summary toggle and the avatar at every
// width. It grows up to 24rem and shrinks to fit. z-40 keeps its results above
// the summary drawer, which shares the header's stacking context.
export const MAP_SEARCH_ROOT_CLASS = "pointer-events-auto relative z-40 w-full max-w-96 min-w-0";

export const MAP_SEARCH_RESULTS_CLASS =
	"absolute inset-x-0 top-full mt-2 max-h-[min(28rem,calc(100vh-6rem))] overflow-y-auto rounded-xl p-1.5 glass-strong";

export const MAP_SEARCH_FIELD_CLASS = "flex h-11 items-center gap-2 rounded-xl px-3 glass-strong";

// Rows sit on glass, so hover and focus use a translucent tint of the text
// color instead of an opaque fill. It reads in the light and the dark theme.
export const MAP_SEARCH_OPTION_HOVER_CLASS =
	"hover:bg-foreground/[0.07] focus:bg-foreground/[0.07] focus:outline-none";
