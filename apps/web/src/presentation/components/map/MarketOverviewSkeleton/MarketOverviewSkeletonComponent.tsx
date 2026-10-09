import { PANEL_SECTION_CLASS } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.styles";
import { SCORE_CARD_CLASS } from "@/presentation/components/displays/ScoreCard/ScoreCardComponent.styles";
import { TrendChartSkeleton } from "@/presentation/components/displays/TrendChartSkeleton/TrendChartSkeletonComponent";
import { FacilitiesTableSkeleton } from "@/presentation/components/map/FacilitiesTableSkeleton/FacilitiesTableSkeletonComponent";

const BAR = "rounded-full bg-[rgba(60,60,67,0.1)]";

function ScoreCardSkeleton() {
	return (
		<div className={SCORE_CARD_CLASS}>
			<div className={`h-3 w-24 ${BAR}`} />
			<div className="h-[29px] w-16 rounded-lg bg-[rgba(60,60,67,0.1)]" />
			<div className={`h-2.5 w-28 ${BAR}`} />
		</div>
	);
}

export function MarketOverviewSkeleton() {
	return (
		<div data-testid="market-overview-skeleton" aria-hidden="true" className="space-y-4 p-5">
			<div className="animate-pulse space-y-2">
				<div className={`h-2.5 w-32 ${BAR}`} />
				<div className="flex items-center justify-between">
					<div className="space-y-1.5">
						<div className={`h-4 w-36 ${BAR}`} />
						<div className={`h-3 w-14 ${BAR}`} />
					</div>
					<div className="h-[23px] w-[75px] rounded-md bg-[rgba(60,60,67,0.1)]" />
				</div>
				<div className={`h-3 w-56 ${BAR}`} />
				<div className={`h-2.5 w-32 ${BAR}`} />
			</div>
			<div className="animate-pulse space-y-2.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-3">
				<div className={`h-6 w-32 ${BAR}`} />
				<div className={`h-3.5 w-11/12 ${BAR}`} />
				<div className={`h-3 w-3/4 ${BAR}`} />
			</div>
			<div className="animate-pulse space-y-2.5">
				<div className={`h-3.5 w-24 ${BAR}`} />
				<div className={SCORE_CARD_CLASS}>
					<div className={`h-3 w-28 ${BAR}`} />
					<div className="h-11 w-32 rounded-lg bg-[rgba(60,60,67,0.1)]" />
				</div>
				<div className="flex gap-2.5">
					<ScoreCardSkeleton />
					<ScoreCardSkeleton />
				</div>
			</div>
			<div className={PANEL_SECTION_CLASS}>
				<div className={`h-4 w-28 animate-pulse ${BAR}`} />
				<TrendChartSkeleton testId="market-trend-skeleton" metricRows={0} />
			</div>
			<FacilitiesTableSkeleton />
		</div>
	);
}
