"use client";

import { AiSummary } from "@/presentation/components/displays/AiSummary/AiSummaryComponent";
import { AiSummarySkeleton } from "@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent";
import { HealthStrip } from "@/presentation/components/displays/HealthStrip/HealthStripComponent";
import { KeyInsights } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent";
import { PanelSection } from "@/presentation/components/displays/PanelSection/PanelSectionComponent";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";
import { WeeklyActivityChart } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent";
import { useMarketSummaryPanelRules } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
import { MARKET_SUMMARY_PANEL_CLASS } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.styles";
import type {
	InsightCardProps,
	MarketRankListProps,
	MarketRankRowsProps,
	MarketSummaryHeaderProps,
	MarketSummaryMetricsProps,
	MarketSummaryPanelProps,
} from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.types";
import { PopularTimesHeatmap } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent";

const SKELETON_TILES = ["facilities", "markets", "played", "confirmation", "players", "activated"];

function MarketSummarySkeleton() {
	return (
		<div data-testid="market-summary-skeleton" aria-hidden className="animate-pulse space-y-4 p-5">
			<div className="space-y-2">
				<div className="h-4 w-1/2 rounded bg-muted" />
				<div className="h-3 w-3/4 rounded bg-muted" />
			</div>
			<div className="h-20 w-full rounded-xl bg-muted" />
			<div className="grid grid-cols-2 gap-3">
				{SKELETON_TILES.map((key) => (
					<div key={key} className="h-20 rounded-xl bg-muted" />
				))}
			</div>
			<div className="h-28 rounded-xl bg-muted" />
			<div className="h-32 rounded-xl bg-muted" />
		</div>
	);
}

function RankRows({ rows, emptyLabel }: Readonly<MarketRankRowsProps>) {
	if (rows.length === 0) return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
	return (
		<ol className="space-y-1.5">
			{rows.map((row) => (
				<li key={row.key} className="flex items-center gap-2.5 text-sm">
					<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-pleiful-pitch-green-5 text-[10px] font-semibold text-pleiful-pitch-green-80 tabular-nums">
						{row.rank}
					</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate font-medium">{row.name}</span>
						<span className="block truncate text-[11px] text-muted-foreground">{row.detail}</span>
					</span>
					<span className="shrink-0 text-xs font-medium tabular-nums">{row.value}</span>
				</li>
			))}
		</ol>
	);
}

function RankList({ title, rows, emptyLabel }: Readonly<MarketRankListProps>) {
	return (
		<section className="space-y-2 rounded-xl border bg-card p-3.5">
			<h3 className="text-xs font-semibold text-foreground">{title}</h3>
			<RankRows rows={rows} emptyLabel={emptyLabel} />
		</section>
	);
}

function InsightCard({ children, isRedesigned }: Readonly<InsightCardProps>) {
	if (isRedesigned) return <HealthStrip>{children}</HealthStrip>;
	return <section className="rounded-xl bg-pleiful-moonlight-5 p-3.5">{children}</section>;
}

function MarketSummaryHeader({
	comparison,
	heading,
	isRedesigned,
	scopeLine,
}: Readonly<MarketSummaryHeaderProps>) {
	if (!isRedesigned) {
		return (
			<header className="pr-8">
				<h2 className="truncate text-base font-semibold">{heading.title}</h2>
				<p className="text-xs text-muted-foreground">{heading.subtitle}</p>
			</header>
		);
	}
	return (
		<header className="space-y-3 border-b pb-3">
			<div>
				<h2 className="truncate text-base font-semibold">{heading.title}</h2>
				<p className="text-xs text-muted-foreground">{scopeLine}</p>
			</div>
			<p data-testid="market-summary-dates" className="flex items-center gap-1.5 text-xs">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className="size-3.5 shrink-0"
				>
					<rect width="18" height="18" x="3" y="4" rx="2" />
					<path d="M16 2v4M8 2v4M3 10h18" />
				</svg>
				<span className="font-semibold">{comparison.current}</span>
				<span className="text-muted-foreground">{comparison.previous}</span>
			</p>
		</header>
	);
}

function MarketSummaryMetrics({
	detailMessages,
	isRedesigned,
	messages,
	rankingsEmptyLabel,
	tiles,
	view,
}: Readonly<MarketSummaryMetricsProps>) {
	const weeklyActivity = (
		<WeeklyActivityChart
			title={detailMessages.weeklyActivity}
			legend={detailMessages.gamesLegend}
			points={view.weeklyActivity}
		/>
	);
	const popularTimes = (
		<PopularTimesHeatmap
			title={detailMessages.popularTimes}
			dayLabels={view.dayLabels}
			periodLabels={view.timePeriodLabels}
			periodRanges={detailMessages.timePeriodRanges}
			cells={view.popularTimes}
			quietLabel={detailMessages.quiet}
			busyLabel={detailMessages.busy}
		/>
	);
	if (!isRedesigned) {
		return (
			<>
				{view.scopeTiles.length > 0 && (
					<StatTiles tiles={view.scopeTiles} testIdPrefix="market-scope" />
				)}
				<StatTiles tiles={view.tiles} testIdPrefix="market-stat" />
				{weeklyActivity}
				{popularTimes}
				{view.topMarkets && (
					<RankList
						title={messages.topMarkets}
						rows={view.topMarkets}
						emptyLabel={rankingsEmptyLabel}
					/>
				)}
				{view.topFacilities && (
					<RankList
						title={messages.topFacilities}
						rows={view.topFacilities}
						emptyLabel={rankingsEmptyLabel}
					/>
				)}
			</>
		);
	}
	return (
		<>
			<PanelSection title={messages.sectionGames} testId="panel-section-games">
				<StatTiles tiles={tiles.games} testIdPrefix="market-stat" />
				{weeklyActivity}
				{popularTimes}
			</PanelSection>
			{tiles.users.length > 0 && (
				<PanelSection title={messages.sectionUsers} testId="panel-section-users">
					<StatTiles tiles={tiles.users} testIdPrefix="market-stat" />
				</PanelSection>
			)}
			{view.topMarkets && (
				<PanelSection title={messages.sectionMarkets} testId="panel-section-markets">
					<RankRows rows={view.topMarkets} emptyLabel={rankingsEmptyLabel} />
				</PanelSection>
			)}
			{view.topFacilities && (
				<PanelSection title={messages.sectionFacilities} testId="panel-section-facilities">
					<RankRows rows={view.topFacilities} emptyLabel={rankingsEmptyLabel} />
				</PanelSection>
			)}
		</>
	);
}

export function MarketSummaryPanel(props: Readonly<MarketSummaryPanelProps>) {
	const {
		aiContext,
		comparison,
		dataAsOf,
		detailMessages,
		handleAnimationEnd,
		heading,
		rankingsEmptyLabel,
		isClosing,
		isSummaryPending,
		isInsightsFailed,
		isRedesigned,
		messages,
		reportWrongNumber,
		scopeLine,
		sectionTiles,
		status,
		view,
	} = useMarketSummaryPanelRules(props);

	return (
		<aside
			aria-label={messages.label}
			aria-busy={status === "loading"}
			data-closing={isClosing}
			onAnimationEnd={handleAnimationEnd}
			className={`${isClosing ? "panel-slide-out" : "panel-slide-in"} ${MARKET_SUMMARY_PANEL_CLASS}`}
		>
			<div className="min-h-0 flex-1 overflow-y-auto">
				{status === "loading" && <MarketSummarySkeleton />}
				{status === "error" && (
					<p role="alert" className="p-5 pr-12 text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && (
					<div className="space-y-4 p-5">
						<MarketSummaryHeader
							comparison={comparison}
							heading={heading}
							isRedesigned={isRedesigned}
							scopeLine={scopeLine}
						/>
						{aiContext && view.summary && (
							<InsightCard isRedesigned={isRedesigned}>
								<AiSummary context={aiContext} fallback={view.summary} introFirst />
							</InsightCard>
						)}
						{!(aiContext && view.summary) && isSummaryPending && (
							<InsightCard isRedesigned={isRedesigned}>
								<AiSummarySkeleton testId="market-summary-text-skeleton" />
							</InsightCard>
						)}
						{!aiContext && !isSummaryPending && view.summary && (
							<InsightCard isRedesigned={isRedesigned}>
								<KeyInsights title={messages.keyInsights} text={view.summary} introFirst />
							</InsightCard>
						)}
						{isInsightsFailed && (
							<p role="status" className="text-xs text-muted-foreground">
								{messages.insightsFailed}
							</p>
						)}
						<MarketSummaryMetrics
							detailMessages={detailMessages}
							isRedesigned={isRedesigned}
							messages={messages}
							rankingsEmptyLabel={rankingsEmptyLabel}
							tiles={sectionTiles}
							view={view}
						/>
						<footer className="flex items-start justify-between gap-3 border-t pt-3 text-[11px] text-muted-foreground">
							<div>
								<p>{view.lastPlayedLabel}</p>
								{isRedesigned && dataAsOf && <p className="opacity-80">{dataAsOf}</p>}
							</div>
							{isRedesigned && (
								<button
									type="button"
									onClick={reportWrongNumber}
									className="shrink-0 rounded font-medium text-foreground/80 underline-offset-2 hover:underline focus-visible:outline-2"
								>
									{messages.reportWrongNumber}
								</button>
							)}
						</footer>
					</div>
				)}
			</div>
		</aside>
	);
}
