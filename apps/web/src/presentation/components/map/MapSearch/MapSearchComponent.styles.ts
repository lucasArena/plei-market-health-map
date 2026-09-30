// The search is portaled into the header row (see HeaderSlotProvider), so the
// row's flex gap keeps it left of the summary toggle and the avatar at every
// width. It grows up to 24rem and shrinks to fit. z-40 keeps its results above
// the summary drawer, which shares the header's stacking context.
export const MAP_SEARCH_ROOT_CLASS = "pointer-events-auto relative z-40 w-full max-w-96 min-w-0";

export const MAP_SEARCH_RESULTS_CLASS =
	"absolute inset-x-0 top-full mt-2 max-h-[min(28rem,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-border/70 bg-background/98 p-1.5 shadow-xl backdrop-blur-md";
