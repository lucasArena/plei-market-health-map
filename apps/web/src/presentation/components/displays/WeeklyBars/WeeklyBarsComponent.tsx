import { TREND_ICON_PATH } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.styles";
import { barHeight } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.rules";
import {
	CAPTION_COLOR,
	WEEKLY_BAR_COLOR,
} from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.styles";
import type { WeeklyBarsProps } from "@/presentation/components/displays/WeeklyBars/WeeklyBarsComponent.types";

export function WeeklyBars({
	aside,
	caption,
	groups,
	points,
	testId,
	title,
}: Readonly<WeeklyBarsProps>) {
	const values = points.map((point) => point.value);
	return (
		<section
			aria-label={title}
			data-testid={testId}
			className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-3.5"
		>
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
				<p className="text-[11px] text-[#6b7280]">{aside}</p>
			</div>
			{caption && (
				<p className="flex items-center gap-1.5 text-xs" data-testid={`${testId}-caption`}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
						className={`size-3.5 ${CAPTION_COLOR[caption.direction]}`}
					>
						<path d={TREND_ICON_PATH[caption.direction]} />
					</svg>
					<span className={`font-semibold ${CAPTION_COLOR[caption.direction]}`}>
						{caption.label}
					</span>
					{caption.sequence && <span className="text-[#6b7280]">· {caption.sequence}</span>}
				</p>
			)}
			<ol className="flex items-end gap-1.5">
				{points.map((point) => (
					<li
						key={point.key}
						aria-label={point.ariaLabel}
						className="flex h-24 min-w-0 flex-1 flex-col items-center justify-end gap-1"
					>
						<span
							className={`text-[10px] font-medium tabular-nums ${point.isLatest ? "text-[#111827]" : "text-[#6b7280]"}`}
						>
							{point.valueLabel}
						</span>
						<span
							data-tone={point.tone}
							className={`w-full rounded ${WEEKLY_BAR_COLOR[point.tone]}`}
							style={{ height: barHeight(point.value, values) }}
						/>
						<span
							className={`text-[10px] whitespace-nowrap ${point.tone === "previous" ? "text-[#9ca3af]" : "text-[#6b7280]"}`}
						>
							{point.weekLabel}
						</span>
					</li>
				))}
			</ol>
			{groups.length > 0 && (
				<div className="flex gap-1.5" aria-hidden="true">
					{groups.map((group) => (
						<p
							key={group.key}
							style={{ flexGrow: group.weeks }}
							className={`basis-0 border-t pt-1 text-center text-[10px] whitespace-nowrap ${group.isCurrent ? "border-[#9ca3af] text-[#6b7280]" : "border-[#d1d5db] text-[#9ca3af]"}`}
						>
							{group.label}
						</p>
					))}
				</div>
			)}
		</section>
	);
}
