import type { HealthStripProps } from "@/presentation/components/displays/HealthStrip/HealthStripComponent.types";

export function HealthStrip({ children }: Readonly<HealthStripProps>) {
	return (
		<section
			data-testid="health-strip"
			className="rounded-xl border border-pleiful-moonlight-10 bg-pleiful-moonlight-5 p-3.5"
		>
			{children}
		</section>
	);
}
