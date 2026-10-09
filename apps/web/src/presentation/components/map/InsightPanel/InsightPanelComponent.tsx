"use client";

import { AiSummary } from "@/presentation/components/displays/AiSummary/AiSummaryComponent";
import { AiSummarySkeleton } from "@/presentation/components/displays/AiSummarySkeleton/AiSummarySkeletonComponent";
import { Avatar } from "@/presentation/components/displays/Avatar/AvatarComponent";
import { GamesMetricsList } from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent";
import { Breadcrumb } from "@/presentation/components/displays/InsightBreadcrumb/InsightBreadcrumbComponent";
import { KeyInsights } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent";
import { ModuleIcon } from "@/presentation/components/displays/ModuleIcon/ModuleIconComponent";
import { StatTiles } from "@/presentation/components/displays/StatTiles/StatTilesComponent";
import {
	INSIGHT_CONTAINER_CLASS,
	METRIC_LABEL_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import { useInsightPanelRules } from "@/presentation/components/map/InsightPanel/InsightPanelComponent.rules";
import {
	MARKET_SUMMARY_PANEL_CLASS,
	PANEL_BODY_CLASS,
	PANEL_CONTENT_CLASS,
	PANEL_DESCRIPTION_CLASS,
	PANEL_HEADER_CLASS,
	PANEL_SECTION_CLASS,
	PANEL_SECTION_TITLE_CLASS,
	PANEL_SECTIONS_CLASS,
	PANEL_TITLE_CLASS,
	SCOPE_CURRENT_CRUMB_ID,
	SCOPE_HEADING_ID,
} from "@/presentation/components/map/InsightPanel/InsightPanelComponent.styles";
import type { InsightPanelProps } from "@/presentation/components/map/InsightPanel/InsightPanelComponent.types";
import { InsightPanelSkeleton } from "@/presentation/components/map/InsightPanelSkeleton/InsightPanelSkeletonComponent";
import { MarketList } from "@/presentation/components/map/MarketList/MarketListComponent";
import { PopularTimesHeatmap } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent";

export function InsightPanel(props: Readonly<InsightPanelProps>) {
	const {
		aiContext,
		detailMessages,
		facilityView,
		locale,
		handleAnimationEnd,
		heading,
		level,
		rankingsEmptyLabel,
		isClosing,
		isSummaryPending,
		isInsightsFailed,
		messages,
		seeAllMarketsLabel,
		seeAllFacilitiesLabel,
		selectCrumb,
		selectFacility,
		selectMarket,
		status,
		view,
	} = useInsightPanelRules(props);
	const crumbs = heading.crumbs.map((crumb) => {
		const { target } = crumb;
		return {
			key: crumb.key,
			label: crumb.label,
			title: crumb.title,
			...(target ? { onSelect: () => selectCrumb(target) } : {}),
		};
	});

	return (
		<aside
			aria-label={messages.label}
			aria-busy={status === "loading"}
			data-closing={isClosing}
			onAnimationEnd={handleAnimationEnd}
			className={`${isClosing ? "panel-slide-out" : "panel-slide-in"} ${MARKET_SUMMARY_PANEL_CLASS}`}
		>
			<header data-testid="market-summary-header" className={`${PANEL_HEADER_CLASS} pr-13`}>
				<div className="min-w-0">
					<h2
						id={SCOPE_HEADING_ID}
						tabIndex={-1}
						aria-describedby={SCOPE_CURRENT_CRUMB_ID}
						className={`${PANEL_TITLE_CLASS} outline-none`}
					>
						{messages.insightPanelTitle}
					</h2>
					<div className={PANEL_DESCRIPTION_CLASS}>
						<Breadcrumb
							label={messages.breadcrumb}
							items={crumbs}
							currentId={SCOPE_CURRENT_CRUMB_ID}
						/>
					</div>
				</div>
			</header>
			<div data-testid="market-summary-body" className={PANEL_BODY_CLASS}>
				{status === "loading" && <InsightPanelSkeleton level={level} />}
				{status === "error" && (
					<p role="alert" className={`${PANEL_CONTENT_CLASS} text-sm text-destructive`}>
						{messages.failed}
					</p>
				)}
				{status === "ready" && view && (
					<div className={PANEL_CONTENT_CLASS}>
						<div data-testid="market-summary-sections" className={PANEL_SECTIONS_CLASS}>
							{facilityView && (
								<div
									data-testid="facility-level-profile"
									className={`${PANEL_SECTION_CLASS} flex items-center gap-3`}
								>
									<Avatar name={facilityView.name} avatarUrl={facilityView.avatarUrl} />
									<p
										title={facilityView.address}
										className="min-w-0 truncate text-[12px] leading-4 text-[#525866]"
									>
										{facilityView.address}
									</p>
								</div>
							)}
							{(view.summary || isSummaryPending || isInsightsFailed) && (
								<section data-testid="market-summary-insight" className={PANEL_SECTION_CLASS}>
									{aiContext && view.summary && (
										<AiSummary context={aiContext} fallback={view.summary} introFirst isFlat />
									)}
									{!(aiContext && view.summary) && isSummaryPending && (
										<AiSummarySkeleton testId="market-summary-text-skeleton" isFlat />
									)}
									{!aiContext && !isSummaryPending && view.summary && (
										<KeyInsights
											title={messages.keyInsights}
											text={view.summary}
											introFirst
											isFlat
										/>
									)}
									{isInsightsFailed && (
										<p role="status" className="text-xs text-muted-foreground">
											{messages.insightsFailed}
										</p>
									)}
								</section>
							)}
							<div data-testid="market-summary-games" data-boxed="" className={PANEL_SECTION_CLASS}>
								<GamesMetricsList view={view.games} messages={messages} />
							</div>
							{view.users && (
								<div
									data-testid="market-summary-users"
									data-boxed=""
									className={PANEL_SECTION_CLASS}
								>
									<GamesMetricsList
										view={view.users}
										messages={messages}
										idPrefix="users"
										icon="users"
									/>
								</div>
							)}
							{!view.users && view.isUsersPending && (
								<div
									data-testid="market-summary-users-skeleton"
									data-boxed=""
									aria-hidden="true"
									className={`${PANEL_SECTION_CLASS} ${INSIGHT_CONTAINER_CLASS} flex flex-col gap-[3px]`}
								>
									<span
										className={`flex items-center gap-[5px] ${METRIC_LABEL_CLASS} leading-[13px]`}
									>
										<ModuleIcon name="users" />
										{messages.usersActivePlayers}
									</span>
									<span className="h-9 w-24 animate-pulse rounded bg-muted" />
								</div>
							)}
							{view.tiles.length > 0 && (
								<div className={PANEL_SECTION_CLASS}>
									<StatTiles tiles={view.tiles} testIdPrefix="market-stat" isFlat />
								</div>
							)}
							{facilityView && (
								<div data-testid="facility-level-popular-times" className={PANEL_SECTION_CLASS}>
									<PopularTimesHeatmap
										title={detailMessages.popularTimes}
										titleClassName={PANEL_SECTION_TITLE_CLASS}
										dayLabels={facilityView.dayLabels}
										periodLabels={facilityView.timePeriodLabels}
										periodRanges={detailMessages.timePeriodRanges}
										cells={facilityView.popularTimes}
										quietLabel={detailMessages.quiet}
										busyLabel={detailMessages.busy}
										hasGlassTooltips
									/>
								</div>
							)}
							{view.topMarkets && view.marketsHero && (
								<div
									data-testid="market-summary-markets"
									data-boxed=""
									className={PANEL_SECTION_CLASS}
								>
									<MarketList
										hero={view.marketsHero}
										locale={locale}
										rows={view.topMarkets}
										emptyLabel={rankingsEmptyLabel}
										seeAllLabel={seeAllMarketsLabel}
										messages={messages}
										onSelect={selectMarket}
									/>
								</div>
							)}
							{view.topFacilities && view.facilitiesHero && (
								<div
									data-testid="market-summary-facilities"
									data-boxed=""
									className={PANEL_SECTION_CLASS}
								>
									{/* Same module as Markets (box, header, table, rows, See all), facilities copy. */}
									<MarketList
										kind="facilities"
										hero={view.facilitiesHero}
										locale={locale}
										rows={view.topFacilities}
										emptyLabel={rankingsEmptyLabel}
										seeAllLabel={seeAllFacilitiesLabel}
										messages={messages}
										onSelect={selectFacility}
									/>
								</div>
							)}
							<footer className={`${PANEL_SECTION_CLASS} text-[11px] text-muted-foreground`}>
								<p>{view.lastPlayedLabel}</p>
							</footer>
						</div>
					</div>
				)}
			</div>
		</aside>
	);
}
