import { STATUS_TONE_STYLE } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.styles";
import type { StatusSummaryProps } from "@/presentation/components/displays/StatusSummary/StatusSummaryComponent.types";

export function StatusSummary({ detail, headline, label, tone }: Readonly<StatusSummaryProps>) {
	const style = STATUS_TONE_STYLE[tone];
	return (
		<section
			data-testid="status-summary"
			data-tone={tone}
			className={`flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3 ${style.box}`}
		>
			<span
				className={`flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-2 text-xs font-semibold ${style.pill}`}
			>
				<span aria-hidden="true" className={`size-2 rounded-full ${style.dot}`} />
				{label}
			</span>
			<p className="text-sm font-medium text-[#111827]">{headline}</p>
			{detail && <p className="text-xs text-[#6b7280]">{detail}</p>}
		</section>
	);
}
