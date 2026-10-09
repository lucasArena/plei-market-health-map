import type { BreadcrumbProps } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent.types";

export function Breadcrumb({ items, label }: Readonly<BreadcrumbProps>) {
	return (
		<nav aria-label={label}>
			<ol className="flex min-w-0 items-center gap-1 overflow-hidden text-[11px] font-medium">
				{items.map((item, index) => (
					<li
						key={item.key}
						className={`flex items-center gap-1 ${index === items.length - 1 ? "min-w-0" : "shrink-0"}`}
					>
						{index > 0 && (
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								className="size-3 shrink-0 text-[#9ca3af]"
							>
								<path d="m9 18 6-6-6-6" />
							</svg>
						)}
						{item.onSelect ? (
							<button
								type="button"
								onClick={item.onSelect}
								className="rounded whitespace-nowrap text-[#6b7280] hover:text-[#111827] hover:underline focus-visible:outline-2"
							>
								{item.label}
							</button>
						) : (
							<span aria-current="page" title={item.label} className="truncate text-[#111827]">
								{item.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
