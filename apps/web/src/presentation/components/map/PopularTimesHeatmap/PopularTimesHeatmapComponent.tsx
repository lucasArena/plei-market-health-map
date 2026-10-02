"use client";

import { edgeTooltipClass } from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.rules";
import {
	HEATMAP_CELL_CLASS,
	HEATMAP_PERIOD_LABEL_CLASS,
	HEATMAP_TOOLTIP_CLASS,
} from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.styles";
import type {
	PopularTimesHeatmapProps,
	PopularTimesHeatmapRowProps,
} from "@/presentation/components/map/PopularTimesHeatmap/PopularTimesHeatmapComponent.types";

export function PopularTimesHeatmap({
	title,
	dayLabels,
	periodLabels,
	periodRanges,
	cells,
	quietLabel,
	busyLabel,
}: Readonly<PopularTimesHeatmapProps>) {
	return (
		<section aria-labelledby="popular-times-title" className="space-y-2">
			<h3 id="popular-times-title" className="text-sm font-semibold">
				{title}
			</h3>
			<div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1 text-center text-[9px] text-muted-foreground">
				<span />
				{dayLabels.map((label) => (
					<span key={label}>{label}</span>
				))}
				{periodLabels.map((periodLabel, periodIndex) => (
					<FragmentRow
						key={periodLabel}
						periodLabel={periodLabel}
						periodRange={periodRanges[periodIndex] ?? ""}
						cells={cells.filter((cell) => cell.periodLabel === periodLabel)}
						periodIndex={periodIndex}
					/>
				))}
			</div>
			<div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
				<span>{quietLabel}</span>
				{HEATMAP_CELL_CLASS.map((className) => (
					<span key={className} className={`size-2.5 rounded-sm ${className}`} />
				))}
				<span>{busyLabel}</span>
			</div>
		</section>
	);
}

function FragmentRow({
	periodLabel,
	periodRange,
	cells,
	periodIndex,
}: Readonly<PopularTimesHeatmapRowProps>) {
	return (
		<>
			<button
				type="button"
				aria-label={periodLabel}
				aria-describedby={`popular-times-period-${periodIndex}`}
				className={HEATMAP_PERIOD_LABEL_CLASS}
			>
				{periodLabel}
				<span
					id={`popular-times-period-${periodIndex}`}
					role="tooltip"
					className={`${HEATMAP_TOOLTIP_CLASS} left-0 translate-x-0`}
				>
					{periodRange}
				</span>
			</button>
			{cells.map((cell, index) => (
				<button
					key={cell.key}
					type="button"
					aria-label={cell.label}
					data-period={periodIndex}
					className={`group relative h-6 rounded-md transition-transform hover:z-10 hover:scale-110 focus:z-10 focus:outline-none focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-pleiful-pitch-green-30 ${HEATMAP_CELL_CLASS[cell.intensity]}`}
				>
					<span
						role="tooltip"
						className={`${HEATMAP_TOOLTIP_CLASS} ${edgeTooltipClass(index, cells.length)}`}
					>
						{cell.tooltip}
					</span>
				</button>
			))}
		</>
	);
}
