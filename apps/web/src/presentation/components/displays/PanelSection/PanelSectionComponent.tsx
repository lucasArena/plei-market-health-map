import type { PanelSectionProps } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.types";

export function PanelSection({ title, aside, children, testId }: Readonly<PanelSectionProps>) {
	return (
		<section
			aria-label={title}
			data-testid={testId}
			className="space-y-3 rounded-[20px] border border-white/80 bg-white/80 p-3.5 shadow-[0_10px_30px_-6px_rgba(31,41,55,0.1),0_1px_2px_rgba(0,0,0,0.05),0_0_0_0.5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[15px]"
		>
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{title}</h3>
				{aside && <p className="text-xs whitespace-nowrap text-[#525866]">{aside}</p>}
			</div>
			{children}
		</section>
	);
}
