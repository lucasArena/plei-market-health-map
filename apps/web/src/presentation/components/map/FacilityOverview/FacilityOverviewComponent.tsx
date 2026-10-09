"use client";

import { GamesTrendChart } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent";
import { MetricRows } from "@/presentation/components/displays/MetricRows/MetricRowsComponent";
import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";
import { ScopeHeader } from "@/presentation/components/displays/ScopeHeader/ScopeHeaderComponent";
import { Scorecards } from "@/presentation/components/displays/Scorecards/ScorecardsComponent";
import { StatusSummary } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent";
import { useFacilityOverviewRules } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.rules";
import type { FacilityOverviewProps } from "@/presentation/components/map/FacilityOverview/FacilityOverviewComponent.types";

export function FacilityOverview(props: Readonly<FacilityOverviewProps>) {
	const {
		demand,
		header,
		rank,
		satisfaction,
		satisfactionPending,
		scorecardsTitle,
		sections,
		trendAside,
		trendTitle,
	} = useFacilityOverviewRules(props);

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
			{rank && (
				<PanelSection title={rank.title} testId="facility-rank">
					<MetricRows metrics={rank.rows} testId="facility-rank-rows" />
				</PanelSection>
			)}
			<PanelSection title={demand.title} testId="facility-demand">
				<MetricRows metrics={demand.rows} testId="facility-demand-rows" />
			</PanelSection>
			{satisfaction ? (
				<PanelSection title={satisfaction.title} testId="facility-satisfaction">
					<MetricRows metrics={satisfaction.rows} testId="facility-satisfaction-rows" />
					{satisfaction.footnote && (
						<p className="text-[11px] text-[#525866]">{satisfaction.footnote}</p>
					)}
					<div className="space-y-1.5 border-t border-[rgba(60,60,67,0.12)] pt-2.5">
						<h4 className="text-xs font-medium text-[#525866]">{satisfaction.reviewsTitle}</h4>
						{satisfaction.reviews.length > 0 ? (
							<ul className="space-y-1" data-testid="facility-low-reviews">
								{satisfaction.reviews.map((review) => (
									<li key={review.id} className="flex items-baseline gap-2 text-xs">
										<span className="shrink-0 font-semibold text-[#b91c1c] tabular-nums">
											{review.rate}
										</span>
										<span className="min-w-0 flex-1 truncate text-[#1d1d1f]">{review.title}</span>
										<span className="shrink-0 text-[11px] text-[#525866]">{review.date}</span>
									</li>
								))}
							</ul>
						) : (
							<p className="text-xs text-[#525866]">{satisfaction.emptyReviews}</p>
						)}
					</div>
				</PanelSection>
			) : (
				<PanelSection title={satisfactionPending.title} testId="facility-satisfaction">
					<MetricRows metrics={satisfactionPending.rows} testId="facility-satisfaction-rows" />
				</PanelSection>
			)}
		</div>
	);
}
