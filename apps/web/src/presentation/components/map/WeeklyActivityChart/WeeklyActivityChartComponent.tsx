"use client";

import { buildWeeklyActivityChart } from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent.rules";
import type { WeeklyActivityChartProps } from "@/presentation/components/map/WeeklyActivityChart/WeeklyActivityChartComponent.types";

const POINT_TOOLTIP_CLASS =
	"pointer-events-none absolute bottom-full z-20 mb-1.5 w-max whitespace-nowrap rounded-md bg-pleiful-pitch-green-80 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

export function WeeklyActivityChart({ title, legend, points }: Readonly<WeeklyActivityChartProps>) {
	const chart = buildWeeklyActivityChart(points);
	return (
		<section aria-labelledby="weekly-activity-title" className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 id="weekly-activity-title" className="text-sm font-semibold">
					{title}
				</h3>
				<p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<span className="size-2 rounded-full bg-pleiful-pitch-green-50" />
					{legend}
				</p>
			</div>
			<div className="relative aspect-[20/7] w-full">
				<svg aria-hidden="true" viewBox="0 0 320 112" className="absolute inset-0 size-full">
					<defs>
						<linearGradient id="weekly-activity-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#5eac97" stopOpacity="0.28" />
							<stop offset="100%" stopColor="#e6faf5" stopOpacity="0.08" />
						</linearGradient>
					</defs>
					<path d="M 10 82 L 310 82" stroke="currentColor" className="text-border" />
					<path d={chart.areaPath} fill="url(#weekly-activity-fill)" />
					<path
						d={chart.linePath}
						fill="none"
						stroke="#16755c"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				{chart.points.map((point) => (
					<button
						key={point.key}
						type="button"
						aria-label={point.tooltip}
						className="group absolute z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-30 focus-visible:ring-offset-2"
						style={{ left: point.left, top: point.top }}
					>
						<span className="absolute inset-1 rounded-full border-2 border-white bg-pleiful-pitch-green-50 shadow-sm transition-transform group-hover:scale-125 group-focus-visible:scale-125" />
						<span role="tooltip" className={`${POINT_TOOLTIP_CLASS} ${point.tooltipClass}`}>
							{point.tooltip}
						</span>
					</button>
				))}
				<div className="absolute right-0 bottom-0 left-0 flex justify-between px-1 text-[10px] text-muted-foreground">
					{chart.points.map((point) => (
						<span key={point.key}>{point.shortLabel}</span>
					))}
				</div>
			</div>
		</section>
	);
}
