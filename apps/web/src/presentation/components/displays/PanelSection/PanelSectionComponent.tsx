import { PANEL_SECTION_CLASS } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.styles";
import type { PanelSectionProps } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.types";

export function PanelSection({ title, aside, children, testId }: Readonly<PanelSectionProps>) {
	return (
		<section aria-label={title} data-testid={testId} className={PANEL_SECTION_CLASS}>
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{title}</h3>
				{aside && <p className="text-xs whitespace-nowrap text-[#525866]">{aside}</p>}
			</div>
			{children}
		</section>
	);
}
