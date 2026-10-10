import { Breadcrumb } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent";
import type { ScopeHeaderProps } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent.types";

export function ScopeHeader({ header, testId }: Readonly<ScopeHeaderProps>) {
	return (
		<header className="space-y-1.5">
			<Breadcrumb items={header.breadcrumb} label={header.breadcrumbLabel} />
			<div className="flex items-center gap-2.5">
				<div className="min-w-0 flex-1">
					<h2
						title={header.title}
						className="truncate text-base font-semibold text-[#111827] dark:text-foreground"
					>
						{header.title}
					</h2>
					<p className="truncate text-xs text-[#6b7280] dark:text-muted-foreground">
						{header.level}
						{header.subtitle && ` · ${header.subtitle}`}
					</p>
				</div>
			</div>
			<p className="flex items-center gap-1.5 text-xs" data-testid={`${testId}-dates`}>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className="size-3 shrink-0 text-[#6b7280] dark:text-muted-foreground"
				>
					<rect width="18" height="18" x="3" y="4" rx="2" />
					<path d="M16 2v4M8 2v4M3 10h18" />
				</svg>
				<span className="font-medium text-[#111827] dark:text-foreground">
					{header.comparison.current}
				</span>
				<span className="text-[#6b7280] dark:text-muted-foreground">
					{header.comparison.previous}
				</span>
			</p>
			{header.footnote && (
				<p className="text-[11px] text-[#6b7280] dark:text-muted-foreground">{header.footnote}</p>
			)}
		</header>
	);
}
