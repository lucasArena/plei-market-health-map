import type { ReactNode } from "react";

export interface DataTableColumn {
	key: string;
	label: string;
	align?: "left" | "right";
}

export interface DataTableRow {
	key: string;
	cells: Record<string, ReactNode>;
}

export interface DataTableProps {
	caption: string;
	columns: DataTableColumn[];
	rows: DataTableRow[];
	emptyLabel: string;
}
