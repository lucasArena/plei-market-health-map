import type { BreadcrumbItem } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent.types";

export interface ScopeHeaderComparison {
	current: string;
	previous: string;
}

export interface ScopeHeaderView {
	breadcrumb: BreadcrumbItem[];
	breadcrumbLabel: string;
	title: string;
	level: string;
	subtitle: string | null;
	comparison: ScopeHeaderComparison;
	footnote: string | null;
}

export interface ScopeHeaderProps {
	header: ScopeHeaderView;
	testId: string;
}
