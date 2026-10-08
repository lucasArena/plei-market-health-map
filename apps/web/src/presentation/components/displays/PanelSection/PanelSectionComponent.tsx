import type { PanelSectionProps } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.types";

export function PanelSection({ title, children, testId }: Readonly<PanelSectionProps>) {
	return (
		<section
			aria-label={title}
			data-testid={testId}
			className="space-y-3 rounded-xl border bg-card/80 p-3.5"
		>
			<h3 className="text-sm font-semibold">{title}</h3>
			{children}
		</section>
	);
}
