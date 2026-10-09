"use client";

import { Breadcrumb } from "@/presentation/components/displays/Breadcrumb/BreadcrumbComponent";
import { GamesTrendChart } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent";
import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";
import { ScoreCard } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent";
import { SegmentedControl } from "@/presentation/components/displays/SegmentedControl/SegmentedControlComponent";
import { StatusSummary } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent";
import { FacilitiesTable } from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent";
import { useMarketOverviewRules } from "@/presentation/components/map/MarketOverview/MarketOverviewComponent.rules";
import type { MarketOverviewProps } from "@/presentation/components/map/MarketOverview/MarketOverviewComponent.types";

export function MarketOverview(props: Readonly<MarketOverviewProps>) {
	const {
		facilities,
		header,
		period,
		scorecardsTitle,
		sections,
		setPeriod,
		trendAside,
		trendTitle,
	} = useMarketOverviewRules(props);

	return (
		<div className="space-y-4" data-testid="market-overview">
			<header className="space-y-1.5">
				<Breadcrumb items={header.breadcrumb} label={header.breadcrumbLabel} />
				<div className="flex items-center gap-2.5">
					<div className="min-w-0 flex-1">
						<h2 className="truncate text-base font-semibold text-[#111827]">{header.title}</h2>
						<p className="text-xs text-[#6b7280]">{header.level}</p>
					</div>
					<SegmentedControl
						label={header.periodLabel}
						options={header.periodOptions}
						value={period}
						onChange={setPeriod}
					/>
				</div>
				<p className="flex items-center gap-1.5 text-xs" data-testid="market-overview-dates">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
						className="size-3 shrink-0 text-[#6b7280]"
					>
						<rect width="18" height="18" x="3" y="4" rx="2" />
						<path d="M16 2v4M8 2v4M3 10h18" />
					</svg>
					<span className="font-medium text-[#111827]">{header.comparison.current}</span>
					<span className="text-[#6b7280]">{header.comparison.previous}</span>
				</p>
				{header.facilitiesActive && (
					<p className="text-[11px] text-[#6b7280]">{header.facilitiesActive}</p>
				)}
			</header>
			{sections && (
				<>
					<StatusSummary {...sections.status} />
					<section aria-label={scorecardsTitle} className="space-y-2.5">
						<h3 className="text-sm font-semibold text-[#111827]">{scorecardsTitle}</h3>
						<ScoreCard {...sections.scorecards.played} size="primary" testId="score-played" />
						<div className="flex gap-2.5">
							<ScoreCard {...sections.scorecards.confirmation} testId="score-confirmation" />
							<ScoreCard {...sections.scorecards.cancellation} testId="score-cancellation" />
						</div>
					</section>
					<PanelSection title={trendTitle} aside={trendAside} testId="market-games-trend-section">
						<GamesTrendChart view={sections.trend} testId="market-games-trend" />
					</PanelSection>
					{facilities && <FacilitiesTable facilities={facilities} marketName={header.title} />}
				</>
			)}
		</div>
	);
}
