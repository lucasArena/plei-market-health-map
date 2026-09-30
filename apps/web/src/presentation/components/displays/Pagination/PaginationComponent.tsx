import type { PaginationProps } from "@/presentation/components/displays/Pagination/PaginationComponent.types";

const BUTTON_CLASS =
	"rounded-md border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({
	page,
	pageCount,
	onPageChange,
	previousLabel,
	nextLabel,
	statusLabel,
}: Readonly<PaginationProps>) {
	return (
		<nav aria-label={statusLabel} className="flex items-center justify-end gap-3">
			<p className="text-xs text-muted-foreground tabular-nums">{statusLabel}</p>
			<button
				type="button"
				onClick={() => onPageChange(page - 1)}
				disabled={page <= 1}
				className={BUTTON_CLASS}
			>
				{previousLabel}
			</button>
			<button
				type="button"
				onClick={() => onPageChange(page + 1)}
				disabled={page >= pageCount}
				className={BUTTON_CLASS}
			>
				{nextLabel}
			</button>
		</nav>
	);
}
