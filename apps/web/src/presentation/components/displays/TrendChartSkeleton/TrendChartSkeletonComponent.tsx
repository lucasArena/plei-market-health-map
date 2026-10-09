import {
	AXIS_LEFT,
	CHART_AXIS,
	CHART_BASELINE,
	CHART_HEIGHT,
	CHART_WIDTH,
} from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.styles";
import {
	SKELETON_AREA_PATH,
	SKELETON_BAR,
	SKELETON_LINE_PATH,
	SKELETON_WEEKS,
} from "@/presentation/components/displays/TrendChartSkeleton/TrendChartSkeletonComponent.styles";
import type { TrendChartSkeletonProps } from "@/presentation/components/displays/TrendChartSkeleton/TrendChartSkeletonComponent.types";

export function TrendChartSkeleton({
	hasLabel = false,
	metricRows,
	testId,
}: Readonly<TrendChartSkeletonProps>) {
	return (
		<div data-testid={testId} aria-hidden="true" className="animate-pulse space-y-3">
			{hasLabel && <div className={`h-3 w-24 ${SKELETON_BAR}`} />}
			<div className="flex items-end gap-2.5">
				<div className="h-[38px] w-28 rounded-lg bg-[rgba(60,60,67,0.1)]" />
				<div className="flex flex-col gap-1.5 pb-[5px]">
					<div className={`h-[18px] w-14 ${SKELETON_BAR}`} />
					<div className={`h-3 w-40 ${SKELETON_BAR}`} />
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<svg
					viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
					preserveAspectRatio="none"
					aria-hidden="true"
					className="h-24 w-full overflow-visible"
				>
					{[CHART_AXIS, CHART_BASELINE].map((y) => (
						<line
							key={y}
							x1={AXIS_LEFT}
							x2={CHART_WIDTH}
							y1={y}
							y2={y}
							stroke="rgba(60,60,67,0.14)"
							strokeDasharray="3 3"
							vectorEffect="non-scaling-stroke"
						/>
					))}
					<path d={SKELETON_AREA_PATH} fill="rgba(60,60,67,0.05)" />
					<path
						d={SKELETON_LINE_PATH}
						fill="none"
						stroke="rgba(60,60,67,0.16)"
						strokeWidth="2"
						strokeLinecap="round"
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
				<div className="flex">
					{SKELETON_WEEKS.map((week) => (
						<div key={week} className="flex flex-1 flex-col items-center gap-1">
							<div className={`h-2.5 w-7 ${SKELETON_BAR}`} />
							<div className={`h-2 w-8 ${SKELETON_BAR}`} />
						</div>
					))}
				</div>
			</div>
			{metricRows > 0 && (
				<div className="flex flex-col gap-2">
					{Array.from({ length: metricRows }, (_, row) => (
						<div key={SKELETON_WEEKS[row] ?? row} className="flex flex-col gap-2">
							<span className="h-px bg-[rgba(60,60,67,0.12)]" />
							<div className="flex items-center gap-3">
								<div className="flex flex-1 flex-col gap-1.5 py-0.5">
									<div className={`h-2.5 w-24 ${SKELETON_BAR}`} />
									<div className="flex items-baseline gap-1.5">
										<div className={`h-4 w-14 ${SKELETON_BAR}`} />
										<div className={`h-3 w-12 ${SKELETON_BAR}`} />
									</div>
								</div>
								<div className={`h-[18px] w-12 ${SKELETON_BAR}`} />
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
