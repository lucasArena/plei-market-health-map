import { PANEL_SECTION_CLASS } from "@/presentation/components/displays/PanelSection/PanelSectionComponent.styles";
import type { FacilitiesTableSkeletonProps } from "@/presentation/components/map/FacilitiesTableSkeleton/FacilitiesTableSkeletonComponent.types";

const BAR = "rounded-full bg-[rgba(60,60,67,0.1)]";

export function FacilitiesTableSkeleton({ rows = 6 }: Readonly<FacilitiesTableSkeletonProps>) {
	return (
		<div
			data-testid="facilities-table-skeleton"
			aria-hidden="true"
			className={`${PANEL_SECTION_CLASS} animate-pulse`}
		>
			<div className="flex items-center justify-between">
				<div className={`h-4 w-24 ${BAR}`} />
				<div className={`h-3 w-5 ${BAR}`} />
			</div>
			<div className="flex items-center gap-2.5 pr-2 pl-2.5">
				<span className="w-3 shrink-0" />
				<div className={`h-2.5 w-14 ${BAR}`} />
				<span className="flex-1" />
				<div className={`h-2.5 w-10 ${BAR}`} />
				<div className={`h-2.5 w-[58px] ${BAR}`} />
			</div>
			<ul className="flex flex-col">
				{Array.from({ length: rows }, (_, row) => `row-${row}`).map((key, index) => (
					<li
						key={key}
						className={`flex items-center gap-2.5 py-2 pr-2 pl-2.5 ${index > 0 ? "border-t border-dashed border-black/10" : ""}`}
					>
						<span className={`size-2.5 shrink-0 ${BAR}`} />
						<span className="flex min-w-0 flex-1 flex-col gap-1.5">
							<span className={`h-3 w-3/5 ${BAR}`} />
							<span className={`h-2.5 w-2/5 ${BAR}`} />
						</span>
						<span className={`h-3.5 w-8 shrink-0 ${BAR}`} />
						<span className={`h-[19px] w-[58px] shrink-0 ${BAR}`} />
					</li>
				))}
			</ul>
		</div>
	);
}
