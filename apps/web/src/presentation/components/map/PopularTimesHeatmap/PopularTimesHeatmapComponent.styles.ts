import { GLASS_TOOLTIP_SURFACE_CLASS } from "@/presentation/components/map/MetricDrillDownPanel/MetricDrillDownPanelComponent.styles";

export const HEATMAP_TOOLTIP_CLASS =
	"pointer-events-none absolute bottom-full z-20 mb-1.5 w-max whitespace-nowrap rounded-md bg-pleiful-pitch-green-80 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

export const HEATMAP_PERIOD_LABEL_CLASS =
	"group relative flex items-center justify-end pr-1 underline decoration-dotted underline-offset-2 cursor-help rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-30";

export const HEATMAP_CELL_CLASS = [
	"bg-pleiful-pitch-green-5",
	"bg-pleiful-pitch-green-10",
	"bg-pleiful-pitch-green-20",
	"bg-pleiful-pitch-green-30",
	"bg-pleiful-pitch-green-50",
] as const;

/** Insight panel variant: the shared glass tooltip surface. */
export const HEATMAP_GLASS_TOOLTIP_CLASS = `pointer-events-none absolute bottom-full z-20 mb-1.5 w-max whitespace-nowrap font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${GLASS_TOOLTIP_SURFACE_CLASS}`;
