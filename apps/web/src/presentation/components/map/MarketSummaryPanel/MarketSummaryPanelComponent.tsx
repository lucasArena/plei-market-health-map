"use client";

import { AiSummary } from "@/presentation/components/displays/AiSummary/AiSummaryComponent";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";
import { WeeklyActivityChart } from "@/presentation/components/displays/WeeklyActivityChart/WeeklyActivityChartComponent";
import { useMarketSummaryPanelRules } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.rules";
import { MARKET_SUMMARY_PANEL_CLASS } from "@/presentation/components/map/MarketSummaryPanel/MarketSummaryPanelComponent.styles";
import type {
	MarketRankListProps,
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

function RankList({ title, rows, emptyLabel }: Readonly<MarketRankListProps>) {
	return (
		<section className="rounded-xl border bg-card p-3.5">
			<h3 className="text-xs font-semibold text-foreground">{title}</h3>
			{rows.length === 0 ? (
				<p className="mt-2 text-xs text-muted-foreground">{emptyLabel}</p>
			) : (
				<ol className="mt-2 space-y-1.5">
					{rows.map((row) => (
						<li key={row.key} className="flex items-center gap-2.5 text-sm">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-pleiful-pitch-green-5 text-[10px] font-semibold text-pleiful-pitch-green-80 tabular-nums">
								{row.rank}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate font-medium">{row.name}</span>
								<span className="block truncate text-[11px] text-muted-foreground">
									{row.detail}
								</span>
							</span>
							<span className="shrink-0 text-xs font-medium tabular-nums">{row.value}</span>
						</li>
					))}
				</ol>
			)}
		</section>
	);
}

export function MarketSummaryPanel(props: Readonly<MarketSummaryPanelProps>) {
	const {
		aiContext,
		detailMessages,
		handleAnimationEnd,
		heading,
		isClosing,
		isSummaryPending,
		messages,
		onClose,
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
			<button
				type="button"
				onClick={onClose}
				aria-label={messages.close}
				className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				×
			</button>
			<div className="min-h-0 flex-1 overflow-y-auto">
				{status === "loading" && <MarketSummarySkeleton />}
				{status === "error" && (
					<p role="alert" className="p-5 pr-12 text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && (
					<div className="space-y-4 p-5">
						<header className="pr-8">
							<h2 className="truncate text-base font-semibold">{heading.title}</h2>
							<p className="text-xs text-muted-foreground">{heading.subtitle}</p>
						</header>
						{view.summary && aiContext && (
							<div className="rounded-xl bg-pleiful-moonlight-5 p-3.5">
								<AiSummary context={aiContext} fallback={view.summary} />
							</div>
						)}
						{!view.summary && isSummaryPending && (
							<div
								data-testid="market-summary-text-skeleton"
								aria-busy="true"
								className="h-20 animate-pulse rounded-xl bg-pleiful-moonlight-5"
							/>
						)}
						{view.scopeTiles.length > 0 && (
							<StatTiles tiles={view.scopeTiles} testIdPrefix="market-scope" />
						)}
						<StatTiles tiles={view.tiles} testIdPrefix="market-stat" />
						<WeeklyActivityChart
							title={detailMessages.weeklyActivity}
							legend={detailMessages.gamesLegend}
							points={view.weeklyActivity}
						/>
						<PopularTimesHeatmap
							title={detailMessages.popularTimes}
							dayLabels={view.dayLabels}
							periodLabels={view.timePeriodLabels}
							cells={view.popularTimes}
							quietLabel={detailMessages.quiet}
							busyLabel={detailMessages.busy}
						/>
						{view.topMarkets && (
							<RankList
								title={messages.topMarkets}
								rows={view.topMarkets}
								emptyLabel={messages.noRankings}
							/>
						)}
						{view.topFacilities && (
							<RankList
								title={messages.topFacilities}
								rows={view.topFacilities}
								emptyLabel={messages.noRankings}
							/>
						)}
						<footer className="border-t pt-3 text-[11px] text-muted-foreground">
							<p>{view.lastPlayedLabel}</p>
						</footer>
					</div>
				)}
			</div>
		</aside>
	);
}
