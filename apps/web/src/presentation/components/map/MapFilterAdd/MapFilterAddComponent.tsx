"use client";

import type {
	MapFilterAddButtonProps,
	MapFilterChevronProps,
} from "@/presentation/components/map/MapFilterAdd/MapFilterAddComponent.types";

export const MAP_FILTER_ROW_GRID_CLASS =
	"grid w-full grid-cols-[0.875rem_minmax(0,1fr)_auto] items-center gap-x-1.5";

export const MAP_FILTER_METRIC_ROW_GRID_CLASS =
	"grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1.5";

export function MapFilterChevron({ open, pointsRight = false }: Readonly<MapFilterChevronProps>) {
	const rotation = {
		[`${true}`]: "",
		[`${pointsRight && !open}`]: "-rotate-90",
		[`${!pointsRight && open}`]: "rotate-180",
	}.true;
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`size-3 shrink-0 text-muted-foreground transition-transform ${rotation}`}
		>
			<path d="m4 6 4 4 4-4" />
		</svg>
	);
}

export function MapFilterAddButton({
	label,
	open,
	onClick,
	buttonRef,
}: Readonly<MapFilterAddButtonProps>) {
	return (
		<button
			ref={buttonRef}
			type="button"
			aria-expanded={open}
			onClick={onClick}
			className={`${MAP_FILTER_ROW_GRID_CLASS} cursor-pointer rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-foreground/[0.07]`}
		>
			<MapFilterRowPrefix />
			<span className="min-w-0 truncate">{label}</span>
			<MapFilterChevron open={open} pointsRight />
		</button>
	);
}

export function MapFilterRowPrefix({ blank = false }: Readonly<{ blank?: boolean }>) {
	return (
		<span
			aria-hidden="true"
			className={`text-center text-xs leading-none ${blank ? "invisible" : ""}`}
		>
			+
		</span>
	);
}
