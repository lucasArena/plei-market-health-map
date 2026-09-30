export const MARKET_SUMMARY_TOGGLE_CLASS = {
	idle: "border bg-background/95 text-pleiful-pitch-green-80 hover:bg-pleiful-pitch-green-5",
	active:
		"border border-pleiful-pitch-green-80 bg-pleiful-pitch-green-80 text-white hover:bg-pleiful-pitch-green-80/90",
} as const;

export const MARKET_SUMMARY_TOGGLE_BASE_CLASS =
	"pointer-events-auto flex size-11 items-center justify-center rounded-full shadow-md backdrop-blur transition-colors focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-80 focus-visible:ring-offset-2 focus-visible:outline-none";
