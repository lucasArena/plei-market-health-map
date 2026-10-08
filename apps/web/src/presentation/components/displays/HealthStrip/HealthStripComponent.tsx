import type { HealthStripProps } from "@/presentation/components/displays/HealthStrip/HealthStripComponent.types";
import { INSIGHT_TONE_STYLE } from "@/presentation/components/displays/KeyInsights/KeyInsightsComponent.styles";

export function HealthStrip({ children, tone = "neutral" }: Readonly<HealthStripProps>) {
	return (
		<section
			data-testid="health-strip"
			data-tone={tone}
			className={`rounded-xl p-3.5 ${INSIGHT_TONE_STYLE[tone].box}`}
		>
			{children}
		</section>
	);
}
