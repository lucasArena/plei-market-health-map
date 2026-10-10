"use client";

import { useGamesTrendChartRules } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.rules";
import {
	AXIS_LEFT,
	GAMES_TREND_COLORS,
	TOOLTIP_ALIGN_CLASS,
	TOOLTIP_PLACEMENT_CLASS,
	TREND_ICON_PATH,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.styles";
import type { GamesTrendChartProps } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.types";
import { MetricRows } from "@/presentation/components/displays/MetricRows/MetricRowsComponent";

export function GamesTrendChart(props: Readonly<GamesTrendChartProps>) {
	const { metricsTestId = "games-metrics", testId = "games-trend-chart", view } = props;
	const {
		active,
		activePoint,
		align,
		axisStart,
		baselineY,
		chartHeight,
		chartWidth,
		geometry,
		gradientId,
		index,
		placement,
		resetActive,
		setActiveIndex,
	} = useGamesTrendChartRules(props);
	const colors = GAMES_TREND_COLORS[view.direction];
	const toLeft = (x: number) => `${(x / chartWidth) * 100}%`;
	const toTop = (y: number) => `${(y / chartHeight) * 100}%`;

	return (
		<div className="space-y-3" data-testid={testId}>
			{view.label && (
				<p className="text-xs font-medium text-[#525866] dark:text-muted-foreground">
					{view.label}
				</p>
			)}
			<div className="flex items-end gap-2.5">
				<p className="text-[36px] leading-[42px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-foreground tabular-nums">
					{view.total}
				</p>
				<div className="flex flex-col items-start gap-[3px] pb-[5px]">
					{view.change && (
						<span
							className={`flex items-center gap-1 rounded-full py-0.5 pr-2 pl-[7px] text-xs leading-4 font-semibold tabular-nums ${GAMES_TREND_COLORS[view.change.direction].pill}`}
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								className="size-3 shrink-0"
							>
								<path d={TREND_ICON_PATH[view.change.direction]} />
							</svg>
							{view.change.label}
						</span>
					)}
					<p className="text-xs text-[#525866] dark:text-muted-foreground">{view.comparison}</p>
				</div>
			</div>
			<div className="flex flex-col gap-0.5">
				<div className="relative h-24">
					<svg
						viewBox={`0 0 ${chartWidth} ${chartHeight}`}
						preserveAspectRatio="none"
						aria-hidden="true"
						className="absolute inset-0 size-full overflow-visible"
					>
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={colors.area} stopOpacity="0.22" />
								<stop offset="100%" stopColor={colors.area} stopOpacity="0" />
							</linearGradient>
						</defs>
						<line
							x1={AXIS_LEFT}
							x2={chartWidth}
							y1={baselineY}
							y2={baselineY}
							stroke="rgba(60,60,67,0.18)"
							strokeDasharray="3 3"
							vectorEffect="non-scaling-stroke"
						/>
						{geometry.axisY !== null && (
							<line
								data-testid="games-trend-axis"
								x1={axisStart}
								x2={chartWidth}
								y1={geometry.axisY}
								y2={geometry.axisY}
								stroke="rgba(60,60,67,0.18)"
								strokeDasharray="3 3"
								vectorEffect="non-scaling-stroke"
							/>
						)}
						<path d={geometry.areaPath} fill={`url(#${gradientId})`} />
						<path
							d={geometry.linePath}
							fill="none"
							stroke={colors.line}
							strokeWidth="2"
							strokeLinecap="round"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
					{view.axisLabel && geometry.axisY !== null && (
						<span
							aria-hidden="true"
							className="absolute left-0 -translate-y-1/2 text-[11px] leading-[13px] text-[rgba(60,60,67,0.6)] tabular-nums"
							style={{ top: toTop(geometry.axisY) }}
						>
							{view.axisLabel}
						</span>
					)}
					{activePoint && active && (
						<>
							<span
								aria-hidden="true"
								className={`absolute size-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full ${colors.halo}`}
								style={{ left: toLeft(activePoint.x), top: toTop(activePoint.y) }}
							/>
							<span
								aria-hidden="true"
								className={`absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-border ${colors.dot}`}
								style={{ left: toLeft(activePoint.x), top: toTop(activePoint.y) }}
							/>
							<span
								data-testid="games-trend-tooltip"
								className={`absolute z-10 flex items-center gap-1 rounded-full border border-white/90 dark:border-border bg-white/70 dark:bg-card px-2 py-[3px] text-[11px] whitespace-nowrap shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.12)] backdrop-blur-[6px] ${TOOLTIP_ALIGN_CLASS[align]} ${TOOLTIP_PLACEMENT_CLASS[placement]}`}
								style={{ left: toLeft(activePoint.x), top: toTop(activePoint.y) }}
							>
								<span className="font-semibold text-[#1d1d1f] dark:text-foreground">
									{active.valueLabel}
								</span>
								<span className="text-[rgba(60,60,67,0.6)]">{active.tooltipLabel}</span>
							</span>
						</>
					)}
					<div className="absolute inset-0 flex">
						{view.points.map((item, pointIndex) => (
							<button
								key={item.key}
								type="button"
								aria-label={item.ariaLabel}
								aria-pressed={pointIndex === index}
								onMouseEnter={() => setActiveIndex(pointIndex)}
								onFocus={() => setActiveIndex(pointIndex)}
								onMouseLeave={resetActive}
								onBlur={resetActive}
								className="h-full flex-1 cursor-default rounded-md outline-none focus-visible:bg-black/5 dark:bg-foreground/5"
							/>
						))}
					</div>
				</div>
				<div className="flex" aria-hidden="true">
					{view.points.map((item) => (
						<span
							key={item.key}
							className={`flex-1 text-center text-[11px] leading-[13px] tabular-nums ${item.isCurrentPeriod ? "font-semibold text-[#1d1d1f] dark:text-foreground" : "text-[rgba(60,60,67,0.6)]"}`}
						>
							{item.valueLabel}
						</span>
					))}
				</div>
				<div className="flex" aria-hidden="true">
					{view.points.map((item) => (
						<span
							key={item.key}
							className={`flex-1 text-center text-[10px] leading-3 whitespace-nowrap ${item.isCurrentPeriod ? "text-[rgba(60,60,67,0.6)]" : "text-[rgba(60,60,67,0.3)]"}`}
						>
							{item.weekLabel}
						</span>
					))}
				</div>
			</div>
			{view.metrics.length > 0 && <MetricRows metrics={view.metrics} testId={metricsTestId} />}
		</div>
	);
}
