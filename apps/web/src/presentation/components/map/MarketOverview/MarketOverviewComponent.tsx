"use client";

import { GamesTrendChart } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent";
import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";
import { ScopeHeader } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent";
import { Scorecards } from "@/presentation/components/displays/Scorecards/ScorecardsComponent";
import { StatusSummary } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent";
import { FacilitiesTable } from "@/presentation/components/map/FacilitiesTable/FacilitiesTableComponent";
import { FacilitiesTableSkeleton } from "@/presentation/components/map/FacilitiesTableSkeleton/FacilitiesTableSkeletonComponent";
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
			<ScopeHeader
				header={header}
				period={period}
				onPeriodChange={setPeriod}
				testId="market-overview"
			/>
			{sections && (
				<>
					<StatusSummary {...sections.status} />
					<Scorecards title={scorecardsTitle} {...sections.scorecards} />
					<PanelSection title={trendTitle} aside={trendAside} testId="market-games-trend-section">
						<GamesTrendChart view={sections.trend} testId="market-games-trend" />
					</PanelSection>
					{facilities ? (
						<FacilitiesTable facilities={facilities} marketName={header.title} />
					) : (
						<FacilitiesTableSkeleton />
					)}
				</>
			)}
		</div>
	);
}
