export interface SortIconProps {
	/** True when this column is the current sort. */
	isActive: boolean;
	/** Current order of the active column; picks the up (asc) or down (desc) chevron. */
	direction: "asc" | "desc";
}
