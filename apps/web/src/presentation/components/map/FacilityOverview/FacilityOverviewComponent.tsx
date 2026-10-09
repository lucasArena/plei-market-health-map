"use client";

import { GamesTrendChart } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent";
import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";
import { ScopeHeader } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent";
import { Scorecards } from "@/presentation/components/displays/Scorecards/ScorecardsComponent";
import { StatusSummary } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent";
import { useFacilityOverviewRules } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.rules";
import type { FacilityOverviewProps } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.types";
import { PopularTimesHeatmap } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent";

export function FacilityOverview(props: Readonly<FacilityOverviewProps>) {
	const { header, popularTimes, scorecardsTitle, sections, trendAside, trendTitle } =
		useFacilityOverviewRules(props);

	return (
		<div className="space-y-4" data-testid="facility-overview">
			<ScopeHeader header={header} testId="facility-overview" />
			{sections && (
				<>
					<StatusSummary {...sections.status} />
					<Scorecards title={scorecardsTitle} {...sections.scorecards} />
					<PanelSection title={trendTitle} aside={trendAside} testId="facility-games-trend-section">
						<GamesTrendChart view={sections.trend} testId="facility-games-trend" />
					</PanelSection>
				</>
			)}
			{popularTimes && <PopularTimesHeatmap {...popularTimes} />}
		</div>
	);
}
