// Sits in the header row, just left of the summary drawer toggle and the avatar
// (two 2.75rem buttons with a 0.5rem gap, inside the header's 1rem padding),
// and shrinks so it never overlaps the logo on the left. z-40 keeps its results
// above the summary drawer (the header is z-30).
export const MAP_SEARCH_POSITION_CLASS =
	"absolute top-4 right-[6.75rem] z-40 w-[min(24rem,calc(100%-11rem))]";
