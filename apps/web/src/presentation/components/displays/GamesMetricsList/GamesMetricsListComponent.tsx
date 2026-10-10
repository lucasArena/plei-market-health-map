"use client";

import {
	tooltipAlignment,
	tooltipPlacement,
	useGamesMetricsListRules,
	xLabelAlignment,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.rules";
import {
	GAMES_CHART_CHANGE_TEXT_CLASS,
	GAMES_CHART_DOT_CLASS,
	GAMES_CHART_HIT_CLASS,
	GAMES_CHART_LABEL_TEXT_CLASS,
	GAMES_CHART_LINE_COLOR,
	GAMES_CHART_PLOT_CLASS,
	GAMES_CHART_POINTS_CLASS,
	GAMES_CHART_TOOLTIP_CLASS,
	GAMES_CHART_VERTEX_CLASS,
	GAMES_CHART_X_LABELS_CLASS,
	GAMES_METRICS_CAPTION_TEXT_CLASS,
	GAMES_METRICS_CARD_CLASS,
	GAMES_METRICS_LIST_CLASS,
	GAMES_METRICS_PENDING_PILL_CLASS,
	GAMES_METRICS_PENDING_VALUE_CLASS,
	GAMES_METRICS_PILL_CLASS,
	GAMES_METRICS_ROW_CLASS,
	GAMES_METRICS_ROW_LABEL_LEADING_CLASS,
	GAMES_METRICS_ROW_VALUE_CLASS,
	GAMES_METRICS_SECONDARY_TEXT_CLASS,
	GAMES_METRICS_TITLE_GROUP_CLASS,
	GAMES_METRICS_TONE_CLASS,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.styles";
import type {
	GamesHeroView,
	GamesMetricChangeView,
	GamesMetricsListProps,
} from "@/presentation/components/displays/GamesMetricsList/GamesMetricsListComponent.types";
import { ModuleIcon } from "@/presentation/components/displays/ModuleIcon/ModuleIconComponent";
import type { ModuleIconName } from "@/presentation/components/displays/ModuleIcon/ModuleIconComponent.types";
import {
	CHANGE_BADGE_ICON_CLASS,
	METRIC_LABEL_CLASS,
} from "@/presentation/components/displays/StatTiles/StatTilesComponent.styles";
import {
	CHART_GRIDLINE_CLASS,
	CHART_TICK_LABEL_POSITION_CLASS,
} from "@/presentation/components/map/ExplorePanel/ExplorePanelComponent.styles";

const ICON_PROPS = {
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2.5,
	strokeLinecap: "round",
	strokeLinejoin: "round",
} as const;

/** lucide trending-up / trending-down / arrow-right at 12px */
function ChangeIcon({ direction }: Readonly<{ direction: GamesMetricChangeView["direction"] }>) {
	const paths = {
		up: ["m22 7-8.5 8.5-5-5L2 17", "M16 7h6v6"],
		down: ["m22 17-8.5-8.5-5 5L2 7", "M16 17h6v-6"],
		flat: ["M5 12h14", "m12 5 7 7-7 7"],
	}[direction];
	return (
		<svg aria-hidden="true" {...ICON_PROPS} className={CHANGE_BADGE_ICON_CLASS}>
			{paths.map((path) => (
				<path key={path} d={path} />
			))}
		</svg>
	);
}

function ChangePill({
	change,
	noPreviousLabel,
}: Readonly<{ change: GamesMetricChangeView | null; noPreviousLabel: string }>) {
	if (!change) {
		return (
			<span
				className={`${GAMES_METRICS_CAPTION_TEXT_CLASS} font-semibold ${GAMES_METRICS_SECONDARY_TEXT_CLASS}`}
			>
				<span aria-hidden="true">{"\u2014"}</span>
				<span className="sr-only">{noPreviousLabel}</span>
			</span>
		);
	}
	return (
		<span
			data-tone={change.tone}
			className={`${GAMES_METRICS_PILL_CLASS} ${GAMES_METRICS_TONE_CLASS[change.tone]}`}
		>
			<ChangeIcon direction={change.direction} />
			<span aria-hidden="true">{change.label}</span>
			<span className="sr-only">{change.description}</span>
		</span>
	);
}

/**
 * Drill-down grid and axis (dashed gridlines, right-hand ticks, column labels)
 * with a green line, a soft gradient below it and a focusable dot per week.
 * The plot is decorative; each focusable dot announces its week as a full
 * sentence, which is the chart's text alternative.
 */
function GamesChart({ view, messages }: Readonly<GamesMetricsListProps>) {
	const { chart, gradientId } = useGamesMetricsListRules(view);
	const count = view.series.length;
	return (
		<div data-testid="games-chart">
			<div className="relative pr-9">
				<div data-testid="games-chart-plot" className={GAMES_CHART_PLOT_CLASS}>
					<div aria-hidden="true" className="absolute inset-0">
						{view.ticks.map((tick) => (
							<div
								key={tick.value}
								data-testid="games-chart-gridline"
								className={CHART_GRIDLINE_CLASS}
								style={{ bottom: `${(tick.value / view.axisMax) * 100}%` }}
							>
								<span
									className={`${CHART_TICK_LABEL_POSITION_CLASS} ${GAMES_CHART_LABEL_TEXT_CLASS}`}
								>
									{tick.label}
								</span>
							</div>
						))}
					</div>
					<div data-testid="games-chart-points" className={GAMES_CHART_POINTS_CLASS}>
						{count > 1 && (
							<svg
								aria-hidden="true"
								data-testid="games-chart-line"
								className="pointer-events-none absolute inset-0 z-0 size-full overflow-visible"
								viewBox="0 0 100 100"
								preserveAspectRatio="none"
							>
								<defs>
									<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
										<stop offset="0" stopColor={GAMES_CHART_LINE_COLOR} stopOpacity={0.24} />
										<stop offset="1" stopColor={GAMES_CHART_LINE_COLOR} stopOpacity={0} />
									</linearGradient>
								</defs>
								<polygon points={chart.areaPoints} fill={`url(#${gradientId})`} />
								<polyline
									points={chart.linePoints}
									fill="none"
									stroke={GAMES_CHART_LINE_COLOR}
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
									vectorEffect="non-scaling-stroke"
								/>
							</svg>
						)}
						{view.series.map((point, index) => {
							const position = chart.points[index];
							if (!position) return null;
							return (
								<button
									key={point.key}
									type="button"
									data-testid="games-chart-dot"
									aria-label={point.summary}
									className={GAMES_CHART_HIT_CLASS}
									style={{
										left: `${position.xPercent}%`,
										width: `${100 / Math.max(1, count - 1)}%`,
									}}
								>
									<span
										aria-hidden="true"
										data-testid="games-chart-vertex"
										className={GAMES_CHART_VERTEX_CLASS}
										style={{ top: `${position.topPercent}%` }}
									>
										<span
											data-testid="games-chart-dot-mark"
											className={GAMES_CHART_DOT_CLASS}
											style={{ backgroundColor: GAMES_CHART_LINE_COLOR }}
										/>
										<span
											data-testid="games-chart-tooltip"
											className={`${GAMES_CHART_TOOLTIP_CLASS} ${tooltipPlacement(position.yPercent)} ${tooltipAlignment(index, count)} flex flex-col items-start gap-0.5 group-hover:opacity-100 group-focus-visible:opacity-100`}
										>
											<span className={GAMES_METRICS_SECONDARY_TEXT_CLASS}>{point.rangeLabel}</span>
											<span className="font-semibold tabular-nums">{point.gamesLabel}</span>
											{point.change ? (
												<span className="flex items-center gap-1">
													<span
														className={`flex items-center gap-0.5 font-semibold tabular-nums ${GAMES_CHART_CHANGE_TEXT_CLASS[point.change.tone]}`}
													>
														<ChangeIcon direction={point.change.direction} />
														{point.change.label}
													</span>
													<span className={GAMES_METRICS_SECONDARY_TEXT_CLASS}>
														{messages.gamesVersusPreviousWeek}
													</span>
												</span>
											) : (
												<span className={GAMES_METRICS_SECONDARY_TEXT_CLASS}>
													{messages.gamesNoPreviousWeek}
												</span>
											)}
										</span>
									</span>
								</button>
							);
						})}
					</div>
				</div>
				<div aria-hidden="true" className={GAMES_CHART_X_LABELS_CLASS}>
					<div className={GAMES_CHART_POINTS_CLASS}>
						{view.series.map((point, index) => (
							<span
								key={point.key}
								data-testid="games-chart-x-label"
								title={point.label}
								className={`absolute top-0 whitespace-nowrap text-muted-foreground ${GAMES_CHART_LABEL_TEXT_CLASS} ${xLabelAlignment(index, count)}`}
								style={{ left: `${chart.points[index]?.xPercent ?? 0}%` }}
							>
								{point.label}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Label (an h3 styled as a metric label), big number with its change pill, and
 * the comparison line. Shared by the Games and Active markets modules.
 */
export function MetricHero({
	testIdPrefix,
	titleId,
	title,
	hero,
	noPreviousLabel,
	showChange = true,
	icon,
}: Readonly<{
	testIdPrefix: string;
	/** 14px icon before the title label. */
	icon?: ModuleIconName;
	titleId: string;
	title: string;
	hero: GamesHeroView;
	noPreviousLabel: string;
	/** False for headers with no previous-period comparison (no pill, no dash). */
	showChange?: boolean;
}>) {
	return (
		<div data-testid={`${testIdPrefix}-title-group`} className={GAMES_METRICS_TITLE_GROUP_CLASS}>
			{/* Still the section's h3 for screen readers, styled as a metric label. */}
			<h3
				id={titleId}
				className={`flex items-center gap-[5px] ${METRIC_LABEL_CLASS} ${GAMES_METRICS_ROW_LABEL_LEADING_CLASS}`}
			>
				{icon && <ModuleIcon name={icon} />}
				{title}
			</h3>
			<div data-testid={`${testIdPrefix}-hero`} className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<p className="text-3xl font-semibold text-[#1d1d1f] tabular-nums">{hero.value}</p>
					{showChange && <ChangePill change={hero.change} noPreviousLabel={noPreviousLabel} />}
				</div>
				<p
					data-testid={`${testIdPrefix}-hero-comparison`}
					className={`${GAMES_METRICS_CAPTION_TEXT_CLASS} ${GAMES_METRICS_SECONDARY_TEXT_CLASS}`}
				>
					{hero.comparison}
				</p>
			</div>
		</div>
	);
}

export function GamesMetricsList({
	view,
	messages,
	idPrefix = "games",
	icon = "games",
}: Readonly<GamesMetricsListProps>) {
	return (
		<section aria-labelledby={`${idPrefix}-metrics-title`} className={GAMES_METRICS_CARD_CLASS}>
			<MetricHero
				testIdPrefix={idPrefix}
				titleId={`${idPrefix}-metrics-title`}
				icon={icon}
				title={view.title}
				hero={view.hero}
				noPreviousLabel={messages.gamesNoPrevious}
			/>
			{view.series.length > 0 && <GamesChart view={view} messages={messages} />}
			{view.rows.length > 0 && (
				<dl data-testid={`${idPrefix}-metrics-rows`} className={GAMES_METRICS_LIST_CLASS}>
					{view.rows.map((row) => (
						<div
							key={row.key}
							data-testid={`${idPrefix}-metric-${row.key}`}
							aria-busy={row.isPending || undefined}
							className={GAMES_METRICS_ROW_CLASS}
						>
							<dt
								className={`col-start-1 row-start-1 truncate ${METRIC_LABEL_CLASS} ${GAMES_METRICS_ROW_LABEL_LEADING_CLASS}`}
							>
								{row.label}
							</dt>
							{row.isPending ? (
								<dd
									data-testid={`${idPrefix}-metric-${row.key}-pending`}
									className="col-span-2 col-start-1 row-start-2 flex items-center justify-between"
								>
									<span aria-hidden="true" className={GAMES_METRICS_PENDING_VALUE_CLASS} />
									<span aria-hidden="true" className={GAMES_METRICS_PENDING_PILL_CLASS} />
									<span className="sr-only">{row.pendingLabel}</span>
								</dd>
							) : (
								<>
									<dd className="col-start-1 row-start-2 flex items-baseline gap-1.5 whitespace-nowrap">
										<span className={GAMES_METRICS_ROW_VALUE_CLASS}>{row.value}</span>
										{row.previousLabel && (
											<span
												className={`${GAMES_METRICS_CAPTION_TEXT_CLASS} tabular-nums ${GAMES_METRICS_SECONDARY_TEXT_CLASS}`}
											>
												{row.previousLabel}
											</span>
										)}
									</dd>
									<dd className="col-start-2 row-span-2 row-start-1 flex items-center justify-end">
										<ChangePill change={row.change} noPreviousLabel={messages.gamesNoPrevious} />
									</dd>
								</>
							)}
						</div>
					))}
				</dl>
			)}
		</section>
	);
}
