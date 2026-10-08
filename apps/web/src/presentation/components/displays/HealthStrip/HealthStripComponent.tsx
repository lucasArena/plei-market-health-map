"use client";

import { useHealthStripRules } from "@/presentation/components/displays/HealthStrip/HealthStripComponent.rules";
import type { HealthStripProps } from "@/presentation/components/displays/HealthStrip/HealthStripComponent.types";

export function HealthStrip({
	children,
	showMoreLabel,
	showLessLabel,
}: Readonly<HealthStripProps>) {
	const { canExpand, contentRef, isCollapsed, isExpanded, toggle } = useHealthStripRules();
	return (
		<section
			data-testid="health-strip"
			className="rounded-xl border border-pleiful-moonlight-10 bg-pleiful-moonlight-5 p-3.5"
		>
			<div
				ref={contentRef}
				data-collapsed={isCollapsed}
				className={
					isExpanded
						? undefined
						: "max-h-44 overflow-hidden data-[collapsed=true]:[mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
				}
			>
				{children}
			</div>
			{canExpand && (
				<button
					type="button"
					onClick={toggle}
					aria-expanded={isExpanded}
					className="relative mx-auto mt-1 block rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-muted"
				>
					{isExpanded ? showLessLabel : showMoreLabel}
				</button>
			)}
		</section>
	);
}
