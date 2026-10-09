import type { SortIconProps } from "@/presentation/components/displays/SortIcon/SortIconComponent.types";

/**
 * Staging's table sort icon (MetricDrillDownPanel on origin/staging): a 12px
 * chevron, 1.25 stroke, muted-foreground. The active column shows it at 80%
 * (up for ascending, down for descending); other columns hide it and show it at
 * 40% on hover or keyboard focus of the parent `group` button.
 */
export function SortIcon({ isActive, direction }: Readonly<SortIconProps>) {
	return (
		<svg
			aria-hidden="true"
			data-testid="sort-icon"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`size-3 shrink-0 text-muted-foreground ${isActive ? "opacity-80" : "opacity-0 group-hover:opacity-40 group-focus-visible:opacity-40"}`}
		>
			<path d={isActive && direction === "asc" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} />
		</svg>
	);
}
