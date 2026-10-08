import type { PanelSectionProps } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.types";

export function PanelSection({ title, aside, children, testId }: Readonly<PanelSectionProps>) {
	return (
		<section
			aria-label={title}
			data-testid={testId}
			className="space-y-3 rounded-xl border bg-card/80 p-3.5"
		>
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
				{aside && <p className="text-xs text-muted-foreground">{aside}</p>}
			</div>
			{children}
		</section>
	);
}
