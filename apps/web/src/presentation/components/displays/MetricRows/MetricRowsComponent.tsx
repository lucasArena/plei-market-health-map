import { TREND_ICON_PATH } from "@/presentation/components/displays/GamesTrendChart/GamesTrendChartComponent.styles";
import { METRIC_PILL } from "@/presentation/components/displays/MetricRows/MetricRowsComponent.styles";
import type {
	MetricRowsProps,
	MetricValueProps,
} from "@/presentation/components/displays/MetricRows/MetricRowsComponent.types";

function MetricValue({ metric }: Readonly<MetricValueProps>) {
	if (metric.isPending) {
		return (
			<dd aria-hidden="true" className="flex animate-pulse items-baseline gap-1.5 py-1">
				<span className="h-4 w-14 rounded bg-muted" />
				<span className="h-3 w-10 rounded bg-muted" />
			</dd>
		);
	}
	return (
		<dd className="flex items-baseline gap-1.5">
			<span className="text-base font-semibold text-[#1d1d1f] dark:text-foreground tabular-nums">
				{metric.value}
			</span>
			<span className="text-[11px] text-[#525866] dark:text-muted-foreground tabular-nums">
				{metric.previous}
			</span>
		</dd>
	);
}

export function MetricRows({ metrics, testId }: Readonly<MetricRowsProps>) {
	return (
		<dl className="flex flex-col gap-2" data-testid={testId}>
			{metrics.map((metric) => (
				<div key={metric.key} className="flex flex-col gap-2">
					<span aria-hidden="true" className="h-px bg-[rgba(60,60,67,0.12)]" />
					<div className="flex items-center gap-3">
						<div className="flex min-w-0 flex-1 flex-col gap-0.5">
							<dt className="text-xs font-medium text-[#525866] dark:text-muted-foreground">
								{metric.label}
							</dt>
							<MetricValue metric={metric} />
						</div>
						{metric.change && (
							<span
								className={`flex shrink-0 items-center gap-1 rounded-full px-[7px] py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums ${METRIC_PILL[metric.change.tone]}`}
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
									<path d={TREND_ICON_PATH[metric.change.direction]} />
								</svg>
								{metric.change.label}
							</span>
						)}
					</div>
				</div>
			))}
		</dl>
	);
}
