import type { StatsPeriod } from "@market-health-map/core/application";
import type { BreadcrumbItem } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent.types";
import type { SegmentedOption } from "@/presentation/components/displays/SegmentedControl/SegmentedControlComponent.types";

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
	periodLabel: string;
	periodOptions: SegmentedOption<StatsPeriod>[];
	comparison: ScopeHeaderComparison;
	footnote: string | null;
}

export interface ScopeHeaderProps {
	header: ScopeHeaderView;
	period?: StatsPeriod;
	onPeriodChange?: (period: StatsPeriod) => void;
	testId: string;
}
