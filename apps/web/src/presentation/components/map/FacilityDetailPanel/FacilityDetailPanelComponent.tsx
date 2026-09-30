"use client";

import { AiSummary } from "@/presentation/components/displays/AiSummary/AiSummaryComponent";
import { Avatar } from "@/presentation/components/displays/Avatar/AvatarComponent";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";
import { useFacilityDetailPanelRules } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.rules";
import { PANEL_CLASS } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.styles";
import type { FacilityDetailPanelProps } from "@/presentation/components/map/FacilityDetailPanel/FacilityDetailPanelComponent.types";
import { PopularTimesHeatmap } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent";
import { WeeklyActivityChart } from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent";

const SKELETON_TILES = ["played", "confirmation", "players", "activated"];

function FacilityDetailSkeleton() {
	return (
		<div data-testid="facility-detail-skeleton" aria-hidden className="animate-pulse space-y-4 p-5">
			<div className="flex items-center gap-3">
				<div className="size-12 rounded-full bg-muted" />
				<div className="flex-1 space-y-2">
					<div className="h-4 w-3/4 rounded bg-muted" />
					<div className="h-3 w-1/2 rounded bg-muted" />
				</div>
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

export function FacilityDetailPanel(props: Readonly<FacilityDetailPanelProps>) {
	const { aiContext, handleAnimationEnd, isAiPending, isClosing, messages, onClose, status, view } =
		useFacilityDetailPanelRules(props);

	return (
		<aside
			aria-label={messages.label}
			aria-busy={status === "loading"}
			data-closing={isClosing}
			onAnimationEnd={handleAnimationEnd}
			className={`${isClosing ? "panel-slide-out" : "panel-slide-in"} ${PANEL_CLASS}`}
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
				{status === "loading" && <FacilityDetailSkeleton />}
				{status === "error" && (
					<p role="alert" className="p-5 pr-12 text-sm text-destructive">
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && (
					<div className="space-y-4 p-5">
						<header className="flex items-center gap-3 pr-8">
							<Avatar name={view.name} avatarUrl={view.avatarUrl} />
							<div className="min-w-0">
								<h2 className="truncate text-base font-semibold">{view.name}</h2>
								<p className="truncate text-xs text-muted-foreground">{view.address}</p>
							</div>
						</header>
						{aiContext && view.summary ? (
							<AiSummary context={aiContext} fallback={view.summary} />
						) : isAiPending ? (
							<div
								data-testid="facility-ai-summary-skeleton"
								aria-busy="true"
								className="h-20 animate-pulse rounded-xl bg-pleiful-moonlight-5"
							/>
						) : null}
						<StatTiles tiles={view.tiles} testIdPrefix="facility-stat" />
						<WeeklyActivityChart
							title={messages.weeklyActivity}
							legend={messages.gamesLegend}
							points={view.weeklyActivity}
						/>
						<PopularTimesHeatmap
							title={messages.popularTimes}
							dayLabels={view.dayLabels}
							periodLabels={view.timePeriodLabels}
							cells={view.popularTimes}
							quietLabel={messages.quiet}
							busyLabel={messages.busy}
						/>
						<footer className="border-t pt-3 text-[11px] text-muted-foreground">
							<p>{view.lastPlayedLabel}</p>
						</footer>
					</div>
				)}
			</div>
		</aside>
	);
}
