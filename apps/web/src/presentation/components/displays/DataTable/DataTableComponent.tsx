import type { DataTableProps } from "@/presentation/components/displays/DataTable/DataTableComponent.types";

const ALIGN_CLASS = { left: "text-left", right: "text-right tabular-nums" } as const;

export function DataTable({ caption, columns, rows, emptyLabel }: Readonly<DataTableProps>) {
	return (
		<div className="overflow-x-auto rounded-xl border bg-card">
			<table className="w-full text-sm">
				<caption className="sr-only">{caption}</caption>
				<thead className="border-b bg-muted/40 text-xs text-muted-foreground">
					<tr>
						{columns.map((column) => (
							<th
								key={column.key}
								scope="col"
								className={`px-3 py-2 font-medium ${ALIGN_CLASS[column.align ?? "left"]}`}
							>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && (
						<tr>
							<td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
								{emptyLabel}
							</td>
						</tr>
					)}
					{rows.map((row) => (
						<tr key={row.key} className="border-b last:border-b-0">
							{columns.map((column) => (
								<td key={column.key} className={`px-3 py-2 ${ALIGN_CLASS[column.align ?? "left"]}`}>
									{row.cells[column.key]}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
